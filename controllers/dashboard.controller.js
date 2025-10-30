const {sequelize} = require("../models");
const moment = require("moment");

module.exports = {
    async dashboardStats(req, res) {
        try {
            const now = moment();

            const startOfThisMonth = now.clone().startOf("month").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const endOfThisMonth = now.clone().endOf("month").endOf("day").format("YYYY-MM-DD HH:mm:ss");
            const startOfLastMonth = now.clone().subtract(1, "month").startOf("month").startOf("day").format("YYYY-MM-DD HH:mm:ss");
            const endOfLastMonth = now.clone().subtract(1, "month").endOf("month").endOf("day").format("YYYY-MM-DD HH:mm:ss");

            /**
             * Begin:: Stats (counts)
             */
            const [stats] = await sequelize.query(`
                SELECT
                  (SELECT COUNT(*) FROM "Students") AS total_stu,
                  (SELECT COUNT(*) FROM "Grades") AS total_grade,
                  (SELECT COUNT(*) FROM "Majors") AS total_major,
                  (SELECT COUNT(*) FROM "Courses") AS total_course
              `);

            /**
             * Begin:: Growth calculation
             */
            const [[thisMonthStu]] = await sequelize.query(`
              SELECT COUNT(*) AS total
              FROM "StudentRecords"
              WHERE DATE("createdAt") BETWEEN '${startOfThisMonth}' AND '${endOfThisMonth}'
            `);

            const [[lastMonthStu]] = await sequelize.query(`
              SELECT COUNT(*) AS total
              FROM "StudentRecords"
              WHERE DATE("createdAt") BETWEEN '${startOfLastMonth}' AND '${endOfLastMonth}'
            `);


            const thisTotal = parseInt(thisMonthStu.total || 0);
            const lastTotal = parseInt(lastMonthStu.total || 0);

            let growthPercent = 0;
            if (lastTotal === 0 && thisTotal > 0) growthPercent = 100;
            else if (lastTotal > 0)
                growthPercent = (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(2);

            const growth = {
                current_month: {total_stu: thisTotal, growth: `${growthPercent}%`},
                last_month: {
                    total_stu: lastTotal,
                    growth: `${lastTotal === 0 ? "0.00" : ((lastTotal / (thisTotal || 1)) * 100).toFixed(2)}%`
                }
            };

            /**
             * Begin:: Recent students (from StudentRecords) with major
             */
            const [recent_stu_registered] = await sequelize.query(`
              SELECT 
                sr.id AS record_id,
                s.first_name,
                s.last_name,
                s.status,
                m.major_name,
                sr."createdAt"
              FROM "StudentRecords" sr
              JOIN "Students" s ON sr."stu_id" = s."id"
              JOIN "Majors" m ON sr."major_id" = m.id
              ORDER BY sr."createdAt" DESC
              LIMIT 10;
            `);

            /**
             * Begin:: Schedule list percentages
             */
            const [scheduleData] = await sequelize.query(`
              SELECT sc.schedule_list AS schedule_name, COUNT(sr.id) AS count
              FROM "StudentRecords" sr
              JOIN "Schedules" sc ON sr."schedule_id" = sc.id
              GROUP BY sc.schedule_list
            `);

            const [[totalCount]] = await sequelize.query(`
              SELECT COUNT(id) AS total FROM "StudentRecords"
            `);

            const total = parseInt(totalCount.total || 0);
            const schedule_list = {};

            scheduleData.forEach(row => {
                const percent = total === 0 ? 0 : (row.count / total) * 100;
                schedule_list[row.schedule_name] = percent.toFixed(2);
            });

            return res.json({
                status: "success",
                error: false,
                message: "ទាញយកទិន្នន័យផ្ទាំងគ្រប់គ្រងបានជោគជ័យ",
                data: {
                    stats: stats[0],
                    growth,
                    recent_stu_registered,
                    schedule_list,
                },
            });
        } catch (error) {
            console.error("Dashboard error:", error);
            return res.status(500).json({
                status: "error",
                error: true,
                message: "មានបញ្ហាខាងម៉ាស៊ីនមេ!",
                details: error.message,
            });
        }
    },
};
