import { asyncHandler } from '../middlewares/asyncHandler.js';
import { success } from '../middlewares/response.js';
import { getJourney } from '../services/customerJourneyService.js';

export const getStaffJourney = asyncHandler(async (req, res) => success(res, { message: 'Lấy hành trình khách hàng thành công.', data: await getJourney(req.user!, { customerId: String(req.params.customerId), from: req.query.from, to: req.query.to }) }));
export const getMyJourney = asyncHandler(async (req, res) => success(res, { message: 'Lấy hành trình của bạn thành công.', data: await getJourney(req.user!, { customerView: true, from: req.query.from, to: req.query.to }) }));
