import type { Operation, BaseState } from '@/types/workflow';

export interface TaskOperationState extends BaseState {
}

export const TaskOperation: Operation = {
	name: 'Task',
	displayName: 'Task',
	description: 'Testing',
	documentationUrl: undefined,
	imageUrl: undefined,
	isRunnable: true,
	inputs: [
    { type: 'string', label: '' }
  ],
	outputs: [{ type: 'string', label: '' }],
	action: async () => ({}),
	initState: () => {
		return { str: '' }
	}
};
