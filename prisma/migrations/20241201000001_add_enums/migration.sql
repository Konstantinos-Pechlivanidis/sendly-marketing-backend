-- CreateEnum
CREATE TYPE "SmsConsent" AS ENUM ('opted_in', 'opted_out', 'unknown');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('immediate', 'scheduled', 'recurring');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('outbound', 'inbound');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'received');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('purchase', 'debit', 'credit', 'refund', 'adjustment');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('welcome', 'abandoned_cart', 'order_confirmation', 'shipping_update', 'delivery_confirmation', 'review_request', 'reorder_reminder', 'birthday');

-- AlterTable
ALTER TABLE "Contact" ALTER COLUMN "smsConsent" DROP DEFAULT;
ALTER TABLE "Contact" ALTER COLUMN "smsConsent" TYPE "SmsConsent" USING ("smsConsent"::text::"SmsConsent");
ALTER TABLE "Contact" ALTER COLUMN "smsConsent" SET DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "scheduleType" TYPE "ScheduleType" USING ("scheduleType"::text::"ScheduleType");
ALTER TABLE "Campaign" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Campaign" ALTER COLUMN "status" TYPE "CampaignStatus" USING ("status"::text::"CampaignStatus");
ALTER TABLE "Campaign" ALTER COLUMN "status" SET DEFAULT 'draft';

-- AlterTable
ALTER TABLE "MessageLog" ALTER COLUMN "direction" TYPE "MessageDirection" USING ("direction"::text::"MessageDirection");
ALTER TABLE "MessageLog" ALTER COLUMN "status" TYPE "MessageStatus" USING ("status"::text::"MessageStatus");

-- AlterTable
ALTER TABLE "WalletTransaction" ALTER COLUMN "type" TYPE "TransactionType" USING ("type"::text::"TransactionType");

-- AlterTable
ALTER TABLE "Automation" ALTER COLUMN "trigger" TYPE "AutomationTrigger" USING ("trigger"::text::"AutomationTrigger");
