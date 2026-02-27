import { partnerPrisma } from "../infrastructure/db/client";

export async function listPartners() {
  return partnerPrisma.partner.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getPartnerById(id: string) {
  return partnerPrisma.partner.findUnique({ where: { id } });
}

export interface UpsertPartnerInput {
  id?: string;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
}

export async function upsertPartner(input: UpsertPartnerInput) {
  const data = {
    name: input.name,
    legalName: input.legalName ?? null,
    taxId: input.taxId ?? null,
  };

  if (input.id) {
    return partnerPrisma.partner.update({ where: { id: input.id }, data });
  }

  return partnerPrisma.partner.create({ data });
}

export interface CreateOrUpdateOperatorInput {
  id?: string;
  partnerId: string;
  name: string;
  email: string;
  phone?: string | null;
  status?: string;
}

// Regla: no permitir Operator sin Partner
export async function createOrUpdateOperator(input: CreateOrUpdateOperatorInput) {
  const partner = await partnerPrisma.partner.findUnique({ where: { id: input.partnerId } });
  if (!partner) {
    throw new Error("partner not found");
  }

  const data = {
    partnerId: input.partnerId,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    status: input.status ?? "ACTIVE",
  };

  if (input.id) {
    return partnerPrisma.operator.update({ where: { id: input.id }, data });
  }

  return partnerPrisma.operator.create({ data });
}
