import { parseTaskItems, validateAgainstTemplate } from '../../src/utils/template-parser';
import { templates, requiredSectionSets } from '../fixtures/templates';

describe('Task List Validation', () => {
  describe('parseTaskItems', () => {
    it('should extract task items from markdown', () => {
      const content = `
Here is a task list:
- [ ] Unchecked item
- [x] Checked item
- [X] Also checked item (capital X)
`;

      const taskItems = parseTaskItems(content);
      expect(taskItems).toHaveLength(3);
      expect(taskItems[0].text).toBe('Unchecked item');
      expect(taskItems[0].checked).toBe(false);
      expect(taskItems[1].text).toBe('Checked item');
      expect(taskItems[1].checked).toBe(true);
      expect(taskItems[2].text).toBe('Also checked item (capital X)');
      expect(taskItems[2].checked).toBe(true);
    });

    it('should handle empty content', () => {
      const taskItems = parseTaskItems('');
      expect(taskItems).toHaveLength(0);
    });

    it('should handle content with no task items', () => {
      const content = `
This is a regular markdown content
with no task items at all.

- Just a regular list item
`;
      const taskItems = parseTaskItems(content);
      expect(taskItems).toHaveLength(0);
    });
  });

  describe('validateAgainstTemplate with task lists', () => {
    it('should pass when all task items are checked', () => {
      const errors = validateAgainstTemplate(
        templates.withTaskLists.description.complete,
        templates.withTaskLists.template,
        requiredSectionSets.checklistOnly,
        true
      );
      
      expect(errors).toHaveLength(0);
    });

    it('should pass when at least one task item is checked', () => {
      const errors = validateAgainstTemplate(
        templates.withTaskLists.description.incomplete,
        templates.withTaskLists.template,
        requiredSectionSets.checklistOnly,
        true
      );
      
      expect(errors).toHaveLength(0);
    });

    it('should fail when no task items are checked', () => {
      const errors = validateAgainstTemplate(
        templates.withTaskLists.description.noneChecked,
        templates.withTaskLists.template,
        requiredSectionSets.checklistOnly,
        true
      );
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('no completed task items');
    });

    it('should fail when task list is missing', () => {
      const errors = validateAgainstTemplate(
        templates.withTaskLists.description.missing,
        templates.withTaskLists.template,
        requiredSectionSets.checklistOnly,
        true
      );
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('missing its task list');
    });

    it('should not enforce task list completion when requireTaskListsCompletion is false', () => {
      const errors = validateAgainstTemplate(
        templates.withTaskLists.description.noneChecked,
        templates.withTaskLists.template,
        requiredSectionSets.checklistOnly,
        false
      );
      
      expect(errors).toHaveLength(0);
    });
  });
});