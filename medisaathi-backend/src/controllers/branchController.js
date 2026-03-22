import { Branch }     from '../models/branch.js';
import { QueueState } from '../models/queueState.js';
import { Token, ACTIVE_STATUSES } from '../models/token.js';
import { sendSuccess, sendError }  from '../utils/responseUtil.js';
import { getTodayIST }             from '../utils/dateUtil.js';

// ── GET /api/branches/:id ─────────────────────────────────────────────────────
export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch
      .findOne({ _id: req.params.id, isActive: true })
      .populate('hospital', 'name city state isActive')
      .select('-createdBy -__v');

    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    // Don't expose a branch whose hospital is deactivated
    if (!branch.hospital?.isActive) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    return sendSuccess(res, { data: { branch } });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/branches/:id/queue-status ────────────────────────────────────────
// Returns live queue stats so patient can see wait time before joining
export const getBranchQueueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const today  = getTodayIST();

    const branch = await Branch.findOne({ _id: id, isActive: true }).select('queueEnabled skipTimeoutSec');
    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    if (!branch.queueEnabled) {
      return sendSuccess(res, {
        data: {
          queueEnabled:    false,
          isPaused:        false,
          currentSequence: 0,
          waitingCount:    0,
          estimatedWaitMin: 0,
        },
      });
    }

    const state = await QueueState.findOne({ branch: id });

    // If no QueueState yet, queue has never been used
    if (!state || state.queueDate !== today) {
      return sendSuccess(res, {
        data: {
          queueEnabled:     true,
          isPaused:         false,
          currentSequence:  0,
          waitingCount:     0,
          estimatedWaitMin: 0,
        },
      });
    }

    const waitingCount = await Token.countDocuments({
      branch:    id,
      queueDate: today,
      status:    'waiting',
    });

    const estimatedWaitMin = waitingCount * state.avgServiceTimeMin;

    return sendSuccess(res, {
      data: {
        queueEnabled:     true,
        isPaused:         state.isPaused,
        currentSequence:  state.currentSequence,
        lastSequence:     state.lastSequence,
        waitingCount,
        estimatedWaitMin,
        avgServiceTimeMin: state.avgServiceTimeMin,
      },
    });
  } catch (err) {
    next(err);
  }
};