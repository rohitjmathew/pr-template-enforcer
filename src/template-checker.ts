import { validateAgainstTemplate } from './utils/template-parser';
import { TEMPLATE_CHECKER_MESSAGES } from './constants';

interface TemplateCheckerOptions {
    requiredSections: string[];
    jiraPattern?: string;
    template?: string | null;
    requireTaskListsCompletion?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class TemplateChecker {
    private requiredSections: string[];
    private jiraPattern?: string;
    private template?: string | null;
    private requireTaskListsCompletion: boolean;

    constructor(options: TemplateCheckerOptions) {
        this.requiredSections = options.requiredSections;
        this.jiraPattern = options.jiraPattern;
        this.template = options.template;
        this.requireTaskListsCompletion = options.requireTaskListsCompletion || false;
    }

    validateDescription(description: string, title: string): ValidationResult {
        const errors: string[] = [];

        // Check for required sections by comparing with template
        const templateErrors = validateAgainstTemplate(
            description,
            this.template ?? null,
            this.requiredSections,
            this.requireTaskListsCompletion
        );

        errors.push(...templateErrors);

        // Validate JIRA ticket reference in title if pattern is provided
        if (this.jiraPattern && this.jiraPattern.trim() !== '') {
            const jiraRegex = new RegExp(this.jiraPattern);
            if (!jiraRegex.test(title)) {
                errors.push(TEMPLATE_CHECKER_MESSAGES.INVALID_JIRA_TICKET.replace('%s', this.jiraPattern));
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}