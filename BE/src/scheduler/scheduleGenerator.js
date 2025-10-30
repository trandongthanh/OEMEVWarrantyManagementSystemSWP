// import cron from "node-cron";
// import dayjs from "dayjs";
// import db from "../models/index.cjs";
// const { WorkSchedule, User, sequelize } = db;

// const DAYS_TO_GENERATE = 7;
// const WORKING_DAYS = [1, 2, 3, 4, 5];

// export const generateSchedules = async () => {
//   const transaction = await sequelize.transaction();

//   try {
//     const technicians = await User.findAll({
//       attributes: ["id"],
//       include: [
//         {
//           model: db.Role,
//           as: "role",
//           where: { roleName: "service_center_technician" },
//           attributes: [],
//         },
//       ],
//       transaction,
//     });

//     if (technicians.length === 0) {
//       await transaction.commit();
//       return;
//     }

//     const schedulesToCreate = [];
//     const today = dayjs();

//     for (const technician of technicians) {
//       for (let i = 0; i < DAYS_TO_GENERATE; i++) {
//         const targetDate = today.add(i, "day");
//         const dayOfWeek = targetDate.day();
//         const workDate = targetDate.format("YYYY-MM-DD");

//         schedulesToCreate.push({
//           technicianId: technician.id,
//           workDate,
//           status: WORKING_DAYS.includes(dayOfWeek) ? "working" : "off",
//         });
//       }
//     }

//     await WorkSchedule.bulkCreate(schedulesToCreate, {
//       updateOnDuplicate: ["status"],
//       transaction,
//     });

//     await transaction.commit();
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// };

// export const initializeScheduleGeneration = () => {
//   cron.schedule("0 1 * * 0", async () => {
//     try {
//       await generateSchedules();
//     } catch (error) {
//       console.error("Schedule generation failed:", error);
//     }
//   });
// };
