import { unified } from 'unified';
import remarkParse from 'remark-parse';
import * as github from '@actions/github';
import * as core from '@actions/core';

interface TemplateSection {
  title: string;
  content: string;
  level: number;
  taskItems?: TaskItem[];
}

interface TaskItem {
  text: string;
  checked: boolean;
}

/**
 * Parse markdown content into sections based on headings
 * @param markdown The markdown content to parse
 * @returns Array of sections with title and content
 */
export function parseMarkdownSections(markdown: string): TemplateSection[] {
  try {
    // Remove any HTML comments from the markdown
    const cleanMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, '');
    
    // Simple regex-based parsing for headings and their content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    const sections: TemplateSection[] = [];
    let lastIndex = 0;
    let lastLevel = 0;
    let lastTitle = '';
    
    while ((match = headingRegex.exec(cleanMarkdown)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      
      // If we found a previous heading, add its content
      if (lastTitle) {
        const sectionContent = cleanMarkdown.substring(lastIndex, match.index).trim();
        sections.push({
          title: lastTitle,
          content: sectionContent,
          level: lastLevel,
          taskItems: parseTaskItems(sectionContent)
        });
      }
      
      lastIndex = match.index + match[0].length;
      lastLevel = level;
      lastTitle = title;
    }
    
    // Add the last section
    if (lastTitle) {
      const sectionContent = cleanMarkdown.substring(lastIndex).trim();
      sections.push({
        title: lastTitle,
        content: sectionContent,
        level: lastLevel,
        taskItems: parseTaskItems(sectionContent)
      });
    }
    
    return sections;
  } catch (error) {
    core.warning(`Error parsing markdown: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Parse task items from markdown content
 * @param content Markdown content to parse for task items
 * @returns Array of task items with text and checked status
 */
export function parseTaskItems(content: string): TaskItem[] {
  const taskItemRegex = /^\s*-\s+\[([ xX])\]\s+(.+)$/gm;
  const taskItems: TaskItem[] = [];
  let match;
  
  while ((match = taskItemRegex.exec(content)) !== null) {
    const checked = match[1].toLowerCase() === 'x';
    const text = match[2].trim();
    
    taskItems.push({
      text,
      checked
    });
  }
  
  return taskItems;
}

/**
 * Get the PR template from the repository
 * @param octokit The Octokit instance
 * @param owner The repository owner
 * @param repo The repository name
 * @returns The PR template content or null if not found
 */
export async function getPRTemplate(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    // Log attempt to find template
    core.info(`Searching for PR template in repository ${owner}/${repo}...`);
    
    // Check for the template in common locations
    const templatePaths = [
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/pull_request_template.md',
      'PULL_REQUEST_TEMPLATE.md',
      'pull_request_template.md',
      'docs/PULL_REQUEST_TEMPLATE.md',
      'docs/pull_request_template.md',
      '.github/PULL_REQUEST_TEMPLATE/default.md'
    ];

    for (const path of templatePaths) {
      try {
        core.debug(`Checking for PR template at: ${path}`);
        
        const response = await octokit.rest.repos.getContent({
          owner,
          repo,
          path
        });
        
        if ('content' in response.data && 'encoding' in response.data) {
          const content = Buffer.from(response.data.content, response.data.encoding as BufferEncoding).toString();
          core.info(`✓ Found PR template at path: ${path}`);
          return content;
        } else {
          core.debug(`Found file at ${path} but content or encoding is missing`);
        }
      } catch (error) {
        // Provide more detailed logging for debugging
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            core.debug(`Template not found at path: ${path}`);
          } else {
            core.debug(`Error accessing ${path}: ${error.message}`);
          }
        }
        
        // Ignore 404 errors - try the next path
        if (error instanceof Error && error.message.includes('404')) {
          continue;
        }
        throw error;
      }
    }
    
    core.warning(`No PR template found in any of the standard locations in ${owner}/${repo}`);
    return null;
  } catch (error) {
    core.warning(`Error fetching PR template: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      core.debug(`Stack trace: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Compare PR description with the template and check for missing sections
 * @param description The PR description
 * @param template The PR template
 * @param requiredSections List of section names that are required
 * @param requireTaskListsCompletion Whether to require all task lists to be completed
 * @returns Array of missing or empty sections
 */
export function validateAgainstTemplate(
  description: string,
  template: string | null,
  requiredSections: string[],
  requireTaskListsCompletion: boolean = false
): string[] {
  const errors: string[] = [];
  
  // If no template was found, fall back to checking for required section headings
  if (!template) {
    core.info('No PR template found. Checking for required sections by name...');
    for (const section of requiredSections) {
      if (!description.includes(section)) {
        errors.push(`Missing required section: "${section}"`);
      }
    }
    return errors;
  }
  
  // Parse both template and description into sections
  const templateSections = parseMarkdownSections(template);
  const descriptionSections = parseMarkdownSections(description);
  
  // Create a map of description sections for quick lookup
  const descriptionSectionMap = new Map<string, TemplateSection>();
  for (const section of descriptionSections) {
    descriptionSectionMap.set(section.title.toLowerCase(), section);
  }

  // Check that all required sections from the template are in the description
  for (const section of templateSections) {
    const sectionTitle = section.title;
    
    // Check if this section is required
    if (requiredSections.some(required => 
      sectionTitle.toLowerCase() === required.toLowerCase() || 
      sectionTitle.toLowerCase().includes(required.toLowerCase())
    )) {
      // Check if the section exists in the description
      if (!descriptionSectionMap.has(sectionTitle.toLowerCase())) {
        errors.push(`Missing required section: "${sectionTitle}"`);
        continue;
      }
      
      const descriptionSection = descriptionSectionMap.get(sectionTitle.toLowerCase())!;
      
      // Check if the section has meaningful content
      const content = descriptionSection.content || '';
      if (!content || content.trim() === '' || content.includes('TODO') || content.includes('Fill this in')) {
        errors.push(`Section "${sectionTitle}" appears to be empty or contains placeholder text.`);
      }
      
      // Check task lists if required
      if (requireTaskListsCompletion && section.taskItems && section.taskItems.length > 0) {
        const descItems = descriptionSection.taskItems || [];
        
        if (descItems.length === 0) {
          errors.push(`Section "${sectionTitle}" is missing its task list from the template.`);
        } else if (!descItems.some(item => item.checked)) {
          errors.push(`Section "${sectionTitle}" has no completed task items. Please complete at least one task.`);
        }
      }
    }
  }
  
  return errors;
}