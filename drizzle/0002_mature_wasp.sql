ALTER TABLE `registrations` ADD `portfolioUrl` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `portfolioKey` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `talents` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `posterUrl` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `posterKey` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `consentPhotoVideo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `consentDataProcessing` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `consentTerms` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `parentalConsentSigned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `registrations` ADD `parentalConsentUrl` text;