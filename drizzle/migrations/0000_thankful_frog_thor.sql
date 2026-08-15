CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH', 'LOGIN', 'LOGOUT');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."draw_session" AS ENUM('AM', 'PM');--> statement-breakpoint
CREATE TYPE "public"."draw_status" AS ENUM('OPEN', 'CLOSED', 'DRAWN', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."lottery_type" AS ENUM('2D', '3D');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('DEPOSIT', 'WITHDRAW', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."setting_type" AS ENUM('GENERAL', 'LOTTERY', 'DEPOSIT', 'WITHDRAW', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."bet_type" AS ENUM('2D', '3D');--> statement-breakpoint
CREATE TYPE "public"."ticket_item_status" AS ENUM('PENDING', 'WON', 'LOST', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('ACTIVE', 'WON', 'LOST', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('DEPOSIT', 'WITHDRAW', 'BET', 'WIN', 'ADJUSTMENT', 'REFUND');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PLAYER');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity" varchar(100) NOT NULL,
	"entity_id" uuid,
	"description" text,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_amount" numeric(18, 2) NOT NULL,
	"approved_amount" numeric(18, 2),
	"payment_method_id" uuid NOT NULL,
	"transaction_number" varchar(150),
	"status" "deposit_status" DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"rejection_reason" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lottery_type" "lottery_type" NOT NULL,
	"draw_date" date NOT NULL,
	"session" "draw_session",
	"draw_time" time,
	"status" "draw_status" DEFAULT 'OPEN' NOT NULL,
	"betting_open" boolean DEFAULT true NOT NULL,
	"result_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lottery_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draw_id" uuid NOT NULL,
	"result" varchar(10) NOT NULL,
	"set_value" varchar(20),
	"value" varchar(20),
	"note" text,
	"created_by" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lottery_results_draw_id_unique" UNIQUE("draw_id")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "payment_method_type" DEFAULT 'BOTH' NOT NULL,
	"account_name" varchar(150),
	"account_number" varchar(100),
	"bank_name" varchar(150),
	"branch" varchar(150),
	"qr_code" varchar(500),
	"enabled" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"type" "setting_type" NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "ticket_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"draw_id" uuid NOT NULL,
	"bet_type" "bet_type" NOT NULL,
	"number" varchar(10) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"multiplier" numeric(10, 2) DEFAULT '1' NOT NULL,
	"potential_win" numeric(18, 2) DEFAULT '0' NOT NULL,
	"win_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "ticket_item_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_amount" numeric(18, 2) NOT NULL,
	"total_win_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "ticket_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'COMPLETED' NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"balance_before" numeric(18, 2),
	"balance_after" numeric(18, 2),
	"payment_method_id" uuid,
	"transaction_number" varchar(150),
	"reference_number" varchar(150),
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150),
	"phone" varchar(30) NOT NULL,
	"role" "user_role" DEFAULT 'PLAYER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_deposit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_withdraw" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_bet" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_win" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"requested_amount" numeric(18, 2) NOT NULL,
	"approved_amount" numeric(18, 2),
	"fee" numeric(18, 2) DEFAULT '0' NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"transaction_number" varchar(150),
	"status" "withdrawal_status" DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"rejection_reason" text,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_draw_id_lottery_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."lottery_draws"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_draw_id_lottery_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."lottery_draws"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;