-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `discord_id` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(255) NOT NULL,
    `tier` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `bio` TEXT NULL,
    `solved_count` INTEGER NOT NULL,
    `profile_img` VARCHAR(255) NULL,
    `create_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notice_time` INTEGER NULL DEFAULT 18,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_discord_id_key`(`discord_id`),
    UNIQUE INDEX `User_handle_key`(`handle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Problem` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `level` INTEGER NOT NULL,
    `challenge` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProblemHolder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `problem_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `strick` BOOLEAN NOT NULL DEFAULT false,
    `challenge` BOOLEAN NOT NULL DEFAULT false,
    `create_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProblemHolder_problem_id_fkey`(`problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProblemHolder` ADD CONSTRAINT `ProblemHolder_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `Problem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProblemHolder` ADD CONSTRAINT `ProblemHolder_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

