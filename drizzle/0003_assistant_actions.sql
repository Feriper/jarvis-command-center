CREATE TABLE `assistant_actions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `type` enum('task','message','publish','financial','other') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `payload` json,
  `status` enum('pending','approved','rejected','executed','cancelled') NOT NULL DEFAULT 'pending',
  `approvedAt` timestamp,
  `executedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `assistant_actions_id` PRIMARY KEY(`id`)
);
