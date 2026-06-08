CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`age` int NOT NULL,
	`category` enum('adults','teens','little_stars') NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`countySubLocation` varchar(255) NOT NULL,
	`photoUrl` text,
	`photoKey` text,
	`paymentStatus` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`registrationDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
