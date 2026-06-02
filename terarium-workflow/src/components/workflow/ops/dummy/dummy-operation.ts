import type { Operation, BaseState } from '@/types/workflow';
import { WorkflowOperationTypes } from '@/types/workflow';

export interface DummyOperationState extends BaseState {
	str: string | null;
}

export const DummyOperation: Operation = {
	name: WorkflowOperationTypes.DUMMY,
	displayName: 'Dummy',
	description: 'Testing',
	documentationUrl: undefined,
	imageUrl: undefined,
	isRunnable: true,
	inputs: [{ type: 'string', label: 'STR' }],
	outputs: [{ type: 'string', label: 'STR' }],
	action: async () => ({}),

	initState: () => {
		return { str: '' }
	}
};
