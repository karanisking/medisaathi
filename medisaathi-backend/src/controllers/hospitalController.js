import { Hospital } from '../models/Hospital.js';
import { Branch }   from '../models/Branch.js';
import { sendSuccess, sendError } from '../utils/responseUtil.js';

// ── GET /api/hospitals ────────────────────────────────────────────────────────
export const getAllHospitals = async (req, res, next) => {
  try {
    const {
      search,
      city,
      state,
      page  = 1,
      limit = 10,
    } = req.query;

    const filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (city)   filter.city  = city.toLowerCase().trim();
    if (state)  filter.state = state.toLowerCase().trim();

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Hospital.countDocuments(filter);

    const hospitals = await Hospital
      .find(filter)
      .select('name city state description contactPhone contactEmail website images isActive createdAt')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // use lean() so we can attach extra fields

    // Attach real branch count for each hospital
    const hospitalIds = hospitals.map((h) => h._id);

    const branchCounts = await Branch.aggregate([
      {
        $match: {
          hospital: { $in: hospitalIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id:   '$hospital',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build a map for O(1) lookup
    const countMap = {};
    branchCounts.forEach((b) => {
      countMap[b._id.toString()] = b.count;
    });

    // Attach branchCount to each hospital object
    const result = hospitals.map((h) => ({
      ...h,
      branchCount: countMap[h._id.toString()] ?? 0,
    }));

    return sendSuccess(res, {
      data: {
        hospitals: result,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hospitals/:id ────────────────────────────────────────────────────
export const getHospitalById = async (req, res, next) => {
  try {
    const hospital = await Hospital
      .findOne({ _id: req.params.id, isActive: true })
      .select('-createdBy -__v')
      .lean();

    if (!hospital) {
      return sendError(res, { statusCode: 404, message: 'Hospital not found' });
    }

    const branches = await Branch
      .find({ hospital: hospital._id, isActive: true })
      .select('name city state address contactPhone contactEmail openTime closeTime images queueEnabled problemCategories')
      .sort({ name: 1 });

    return sendSuccess(res, {
      data: {
        hospital: {
          ...hospital,
          branchCount: branches.length,
        },
        branches,
      },
    });
  } catch (err) {
    next(err);
  }
};