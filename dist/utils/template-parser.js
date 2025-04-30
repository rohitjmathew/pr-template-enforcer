"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgainstTemplate = exports.getPRTemplate = exports.parseTaskItems = exports.parseMarkdownSections = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Parse markdown content into sections based on headings
 * @param markdown The markdown content to parse
 * @returns Array of sections with title and content
 */
function parseMarkdownSections(markdown) {
    try {
        // Remove any HTML comments from the markdown
        const cleanMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, '');
        // Simple regex-based parsing for headings and their content
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        const sections = [];
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
    }
    catch (error) {
        core.warning(`Error parsing markdown: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}
exports.parseMarkdownSections = parseMarkdownSections;
/**
 * Parse task items from markdown content
 * @param content Markdown content to parse for task items
 * @returns Array of task items with text and checked status
 */
function parseTaskItems(content) {
    const taskItemRegex = /^\s*-\s+\[([ xX])\]\s+(.+)$/gm;
    const taskItems = [];
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
exports.parseTaskItems = parseTaskItems;
/**
 * Get the PR template from the repository
 * @param octokit The Octokit instance
 * @param owner The repository owner
 * @param repo The repository name
 * @returns The PR template content or null if not found
 */
function getPRTemplate(octokit, owner, repo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
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
                    const response = yield octokit.rest.repos.getContent({
                        owner,
                        repo,
                        path
                    });
                    if ('content' in response.data && 'encoding' in response.data) {
                        const content = Buffer.from(response.data.content, response.data.encoding).toString();
                        return content;
                    }
                }
                catch (error) {
                    // Ignore 404 errors - try the next path
                    if (error instanceof Error && error.message.includes('404')) {
                        continue;
                    }
                    throw error;
                }
            }
            return null;
        }
        catch (error) {
            core.warning(`Error fetching PR template: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    });
}
exports.getPRTemplate = getPRTemplate;
/**
 * Compare PR description with the template and check for missing sections
 * @param description The PR description
 * @param template The PR template
 * @param requiredSections List of section names that are required
 * @param requireTaskListsCompletion Whether to require all task lists to be completed
 * @returns Array of missing or empty sections
 */
function validateAgainstTemplate(description, template, requiredSections, requireTaskListsCompletion = false) {
    const errors = [];
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
    const descriptionSectionMap = new Map();
    for (const section of descriptionSections) {
        descriptionSectionMap.set(section.title.toLowerCase(), section);
    }
    // Check that all required sections from the template are in the description
    for (const section of templateSections) {
        const sectionTitle = section.title;
        // Check if this section is required
        if (requiredSections.some(required => sectionTitle.toLowerCase() === required.toLowerCase() ||
            sectionTitle.toLowerCase().includes(required.toLowerCase()))) {
            // Check if the section exists in the description
            if (!descriptionSectionMap.has(sectionTitle.toLowerCase())) {
                errors.push(`Missing required section: "${sectionTitle}"`);
                continue;
            }
            const descriptionSection = descriptionSectionMap.get(sectionTitle.toLowerCase());
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
                }
                else if (!descItems.some(item => item.checked)) {
                    errors.push(`Section "${sectionTitle}" has no completed task items. Please complete at least one task.`);
                }
            }
        }
    }
    return errors;
}
exports.validateAgainstTemplate = validateAgainstTemplate;
