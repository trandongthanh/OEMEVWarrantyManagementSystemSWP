import express from "express";
import multer from "multer";
import { authentication, authorizationByRole } from "../middleware/index.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file Excel (.xlsx, .xls)"));
    }
  },
});

/**
 * @swagger
 * /work-schedules/upload:
 *   post:
 *     summary: Upload Excel file để import work schedules
 *     description: Manager upload file Excel để tạo lịch làm việc hàng loạt cho technicians
 *     tags: [WorkSchedule]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File Excel chứa work schedules (.xlsx)
 *     responses:
 *       200:
 *         description: Upload thành công
 *       400:
 *         description: Lỗi validation hoặc file không hợp lệ
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ manager mới có quyền
 */
router.post(
  "/upload",
  authentication,
  authorizationByRole(["service_center_manager"]),
  upload.single("file"),
  async (req, res, next) => {
    const workScheduleController = req.container.resolve(
      "workScheduleController"
    );
    await workScheduleController.uploadSchedules(req, res, next);
  }
);

/**
 * @swagger
 * /work-schedules:
 *   get:
 *     summary: Lấy danh sách work schedules
 *     description: Manager xem tất cả work schedules với filters
 *     tags: [WorkSchedule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lọc theo technician
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Danh sách work schedules
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  authentication,
  authorizationByRole(["service_center_manager"]),
  async (req, res, next) => {
    const workScheduleController = req.container.resolve(
      "workScheduleController"
    );
    await workScheduleController.getSchedules(req, res, next);
  }
);

/**
 * @swagger
 * /work-schedules/my-schedule:
 *   get:
 *     summary: Technician xem lịch làm việc của mình
 *     description: Technician xem work schedule cá nhân
 *     tags: [WorkSchedule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Work schedule của technician
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-schedule",
  authentication,
  authorizationByRole(["technician"]),
  async (req, res, next) => {
    const workScheduleController = req.container.resolve(
      "workScheduleController"
    );
    await workScheduleController.getMySchedule(req, res, next);
  }
);

/**
 * @swagger
 * /work-schedules/available-technicians:
 *   get:
 *     summary: Lấy danh sách technicians available trong một ngày
 *     description: Manager kiểm tra technicians nào available để assign task
 *     tags: [WorkSchedule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần kiểm tra (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Danh sách technicians available
 *       400:
 *         description: Thiếu workDate
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/available-technicians",
  authentication,
  authorizationByRole(["service_center_manager"]),
  async (req, res, next) => {
    const workScheduleController = req.container.resolve(
      "workScheduleController"
    );
    await workScheduleController.getAvailableTechnicians(req, res, next);
  }
);

/**
 * @swagger
 * /work-schedules/{scheduleId}:
 *   patch:
 *     summary: Cập nhật một work schedule
 *     description: Manager cập nhật status hoặc notes của schedule
 *     tags: [WorkSchedule]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Schedule không tồn tại
 */
router.patch(
  "/:scheduleId",
  authentication,
  authorizationByRole(["service_center_manager"]),
  async (req, res, next) => {
    const workScheduleController = req.container.resolve(
      "workScheduleController"
    );
    await workScheduleController.updateSchedule(req, res, next);
  }
);

export default router;
