import type { Operation, BaseState } from '@/types/workflow';
import { WorkflowOperationTypes } from '@/types/workflow';

export interface Dummy2OperationState extends BaseState {
}

export const Dummy2Operation: Operation = {
	name: WorkflowOperationTypes.DUMMY2,
	displayName: 'Dummy2',
	description: 'Testing',
	documentationUrl: undefined,
	imageUrl: undefined,
	isRunnable: true,
	inputs: [
    { type: 'string', label: 'v' },
    { type: 'string', label: 'v' }
  ],
	outputs: [{ type: 'string', label: '' }],
	action: async () => ({}),

	initState: () => {
		return { str: '' }
	}
};
