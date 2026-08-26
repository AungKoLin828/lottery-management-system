CREATE TYPE "public"."number_restriction_type" AS ENUM('2D', '3D');--> statement-breakpoint
CREATE TABLE "draw_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enable_2d_draw" boolean DEFAULT true NOT NULL,
	"enable_3d_draw" boolean DEFAULT true NOT NULL,
	"two_d_draw_time" varchar(5) DEFAULT '16:30' NOT NULL,
	"three_d_draw_time" varchar(5) DEFAULT '16:30' NOT NULL,
	"ticket_closing_time_2d" varchar(5) DEFAULT '16:00' NOT NULL,
	"ticket_closing_time_3d" varchar(5) DEFAULT '16:00' NOT NULL,
	"manual_result_entry" boolean DEFAULT true NOT NULL,
	"result_publishing" boolean DEFAULT true NOT NULL,
	"draw_status" varchar(20) DEFAULT 'Open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_number_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lottery_type" varchar(10) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"number_length" integer NOT NULL,
	"min_bet" integer DEFAULT 100 NOT NULL,
	"max_bet" integer DEFAULT 100000 NOT NULL,
	"max_number_limit" integer DEFAULT 10 NOT NULL,
	"allow_duplicate_numbers" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(3) NOT NULL,
	"type" "number_restriction_type" NOT NULL,
	"reason" varchar(255) DEFAULT 'Admin restriction' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "number_restrictions_number_type_unique" UNIQUE("number","type")
);
