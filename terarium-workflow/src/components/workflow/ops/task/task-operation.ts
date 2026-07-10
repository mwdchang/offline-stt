import type { Operation, BaseState } from '@/types/workflow';
import { WorkflowOperationTypes } from '@/types/workflow';

export interface TaskOperationState extends BaseState {
}

export const TaskOperation: Operation = {
	name: WorkflowOperationTypes.DUMMY2,
	displayName: 'Dummy2',
	description: 'Testing',
	documentationUrl: undefined,
	imageUrl: undefined,
	isRunnable: true,
	inputs: [
    { type: 'string', label: '' },
    { type: 'string', label: '' }
  ],
	outputs: [{ type: 'string', label: '' }],
	action: async () => ({}),

	initState: () => {
		return { str: '' }
	}
};
