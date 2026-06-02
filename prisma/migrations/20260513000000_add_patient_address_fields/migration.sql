-- AlterTable: add address fields to Patient for ViaCEP integration
ALTER TABLE "Patient" ADD COLUMN "cep" TEXT;
ALTER TABLE "Patient" ADD COLUMN "logradouro" TEXT;
ALTER TABLE "Patient" ADD COLUMN "numero" TEXT;
ALTER TABLE "Patient" ADD COLUMN "complemento" TEXT;
ALTER TABLE "Patient" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Patient" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Patient" ADD COLUMN "uf" CHAR(2);
