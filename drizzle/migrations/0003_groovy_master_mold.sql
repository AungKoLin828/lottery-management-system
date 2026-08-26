ALTER TABLE "payment_methods" ALTER COLUMN "type" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "account_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "account_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_methods" ALTER COLUMN "display_order" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "payment_methods" DROP COLUMN "qr_code";--> statement-breakpoint
DROP TYPE "public"."payment_method_type";