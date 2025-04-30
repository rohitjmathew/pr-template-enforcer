"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateChecker = void 0;
const template_parser_1 = require("./utils/template-parser");
class TemplateChecker {
    constructor(options) {
        this.requiredSections = options.requiredSections;
        this.jiraPattern = options.jiraPattern;
        this.template = options.template;
        this.requireTaskListsCompletion = options.requireTaskListsCompletion || false;
    }
    validateDescription(description, title) {
        var _a;
        const errors = [];
        // Check for required sections by comparing with template
        const templateErrors = (0, template_parser_1.validateAgainstTemplate)(description, (_a = this.template) !== null && _a !== void 0 ? _a : null, this.requiredSections, this.requireTaskListsCompletion);
        errors.push(...templateErrors);
        // Validate JIRA ticket reference in title if pattern is provided
        if (this.jiraPattern && this.jiraPattern.trim() !== '') {
            const jiraRegex = new RegExp(this.jiraPattern);
            if (!jiraRegex.test(title)) {
                errors.push(`PR title does not contain a valid JIRA ticket reference. Expected pattern: ${this.jiraPattern}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.TemplateChecker = TemplateChecker;
