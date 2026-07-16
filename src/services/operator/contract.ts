import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

export async function generateOperatorContract(operatorId: string) {
  const operator = await prisma.operator.findUnique({
    where: { id: operatorId },
    select: {
      id: true,
      name: true,
      type: true,
      cnpj: true,
      cpf: true,
      cadastur: true,
    },
  });

  if (!operator) {
    throw new Error('Operator not found');
  }

  const identifier = operator.type === 'AGENCY' ? operator.cnpj : operator.cpf;
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR');

  const contractsDir = path.join(process.cwd(), 'public', 'contracts');
  await fs.promises.mkdir(contractsDir, { recursive: true });

  const fileName = `operator-${operator.id}.pdf`;
  const filePath = path.join(contractsDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(18).text('Contrato de Operador NativaGo', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`Operador: ${operator.name}`);
  if (identifier) {
    doc.text(`Documento: ${identifier}`);
  }
  if (operator.cadastur) {
    doc.text(`CADASTUR: ${operator.cadastur}`);
  }
  doc.text(`Data: ${dateStr}`);

  doc.moveDown();
  doc.text('- NativaGo atua apenas como plataforma de intermediação entre viajantes e operadores turísticos.');
  doc.moveDown(0.5);
  doc.text('- O operador é o único responsável pela execução dos serviços turísticos ofertados na plataforma.');
  doc.moveDown(0.5);
  doc.text('- O operador declara possuir todas as licenças, registros (incluindo CADASTUR, quando aplicável) e seguros exigidos pela legislação vigente.');
  doc.moveDown(0.5);
  doc.text('- O valor de sinal cobrado pela NativaGo representa apenas a taxa de intermediação e reserva; o restante do valor é pago diretamente ao operador.');
  doc.moveDown(0.5);
  doc.text('- NativaGo não participa da operação turística, não acompanha a execução do serviço e não assume qualquer responsabilidade pela experiência prestada.');
  doc.moveDown(0.5);
  doc.text('- A responsabilidade civil integral pela prestação do serviço turístico é exclusiva do operador.');

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => resolve());
    writeStream.on('error', (err) => reject(err));
  });

  const publicPath = `/contracts/${fileName}`;

  await prisma.operator.update({
    where: { id: operator.id },
    data: { contractUrl: publicPath },
  });

  return publicPath;
}
