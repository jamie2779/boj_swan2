-- DropForeignKey
ALTER TABLE `problemholder` DROP FOREIGN KEY `ProblemHolder_user_id_fkey`;

-- DropIndex
DROP INDEX `ProblemHolder_user_id_problem_id_key` ON `problemholder`;

-- AddForeignKey
ALTER TABLE `ProblemHolder` ADD CONSTRAINT `ProblemHolder_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
