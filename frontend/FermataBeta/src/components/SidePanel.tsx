import type { ClimberState } from '../types';

interface Props {
  selectedHold: number | null;
  assignHoldType: (type: 'start_hand' | 'start_foot' | 'finish_hold') => void;
  assignLimbToHold: (limb: keyof ClimberState) => void;
  removeSelectedHold: () => void;
  startState: ClimberState;
  finishHold: number | null;
  holdsLength: number;
}

export default function SidePanel({
  selectedHold,
  assignHoldType,
  assignLimbToHold,
  removeSelectedHold,
  startState,
  finishHold,
  holdsLength
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hold Management</h3>

      {selectedHold !== null ? (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Hold #{selectedHold} selected
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Hold Type:</h4>
            <div className="space-y-2">
              <button
                onClick={() => assignHoldType('start_hand')}
                className="w-full px-3 py-2 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
              >
                Start Hand
              </button>
              <button
                onClick={() => assignHoldType('start_foot')}
                className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
              >
                Start Foot
              </button>
              <button
                onClick={() => assignHoldType('finish_hold')}
                className="w-full px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              >
                Finish Hold
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Starting Limb:</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => assignLimbToHold('RH')}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
              >
                Right Hand
              </button>
              <button
                onClick={() => assignLimbToHold('LH')}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition-colors"
              >
                Left Hand
              </button>
              <button
                onClick={() => assignLimbToHold('RF')}
                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors"
              >
                Right Foot
              </button>
              <button
                onClick={() => assignLimbToHold('LF')}
                className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 transition-colors"
              >
                Left Foot
              </button>
            </div>
          </div>

          <button
            onClick={removeSelectedHold}
            className="w-full px-3 py-2 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
          >
            Remove Hold
          </button>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p className="text-sm mb-4">
            Click a hold on the image to select it and assign properties.
          </p>
          <p className="text-xs text-gray-400">
            Click empty space to add new holds.
          </p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Problem Status</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Starting Positions:</span>
            <span className="font-medium">
              {Object.values(startState).filter((v) => v !== null).length}/4
            </span>
          </div>
          <div className="flex justify-between">
            <span>Finish Hold:</span>
            <span className="font-medium">
              {finishHold !== null ? `#${finishHold}` : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Holds:</span>
            <span className="font-medium">{holdsLength}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
