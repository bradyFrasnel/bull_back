import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class BulletinPdfService {
  // ─────────────────────────────────────────────
  // GÉNÉRATION PDF DEPUIS HTML
  // ─────────────────────────────────────────────
  async genererPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      });
      return Buffer.from(buffer);
    } finally {
      await browser.close();
    }
  }

  // ─────────────────────────────────────────────
  // TEMPLATE HTML — BULLETIN SEMESTRIEL
  // ─────────────────────────────────────────────
  genererHtmlBulletin(data: any): string {
    const { etudiant, semestre, ues, resultat, statistiques } = data;

    const mention = resultat ? this.getMention(resultat.moyenneSemestre) : null;
    const mentionColor = this.getMentionColor(mention);

    const uesHtml = (ues ?? [])
      .map((ue: any) => {
        const acquise = ue.moyenne !== null && ue.moyenne >= 10;
        const matieresHtml = (ue.matieres ?? [])
          .map(
            (m: any) => `
          <tr>
            <td style="padding:6px 8px; font-size:12px;">${m.libelle}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.coefficient}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.credits}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.noteCC !== null ? m.noteCC.toFixed(2) : '—'}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.noteExamen !== null ? m.noteExamen.toFixed(2) : '—'}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.noteRattrapage !== null ? m.noteRattrapage.toFixed(2) : '—'}</td>
            <td style="text-align:center; padding:6px 4px; font-size:12px; font-weight:bold; color:${m.moyenne !== null && m.moyenne >= 10 ? '#16a34a' : '#dc2626'};">
              ${m.moyenne !== null ? m.moyenne.toFixed(2) : '—'}
            </td>
            <td style="text-align:center; padding:6px 4px; font-size:12px;">${m.absences > 0 ? m.absences + 'h' : '—'}</td>
          </tr>`,
          )
          .join('');

        return `
        <div style="margin-bottom:16px; border:1px solid #e5e7eb; border-radius:6px; overflow:hidden;">
          <div style="background:${acquise ? '#dcfce7' : '#fee2e2'}; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; font-size:13px; color:#1e293b;">${ue.code} — ${ue.libelle}</span>
            <span style="font-size:12px; color:#64748b;">
              Crédits : ${ue.creditsAcquis}/${ue.creditsTotal} &nbsp;|&nbsp;
              Moyenne : <strong style="color:${acquise ? '#16a34a' : '#dc2626'};">${ue.moyenne !== null ? ue.moyenne.toFixed(2) : '—'}/20</strong>
              ${ue.compensee ? ' &nbsp;<span style="background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:4px; font-size:11px;">Compensée</span>' : ''}
            </span>
          </div>
          <table style="width:100%; border-collapse:collapse; background:#fff;">
            <thead>
              <tr style="background:#f8fafc; font-size:11px; color:#64748b; border-bottom:1px solid #e5e7eb;">
                <th style="text-align:left; padding:6px 8px;">Matière</th>
                <th style="text-align:center; padding:6px 4px;">Coef.</th>
                <th style="text-align:center; padding:6px 4px;">Crédits</th>
                <th style="text-align:center; padding:6px 4px;">CC</th>
                <th style="text-align:center; padding:6px 4px;">Examen</th>
                <th style="text-align:center; padding:6px 4px;">Rattrapage</th>
                <th style="text-align:center; padding:6px 4px;">Moyenne</th>
                <th style="text-align:center; padding:6px 4px;">Absences</th>
              </tr>
            </thead>
            <tbody>${matieresHtml}</tbody>
          </table>
        </div>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
    .page { padding: 20px; max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
<div class="page">

  <!-- EN-TÊTE -->
  <div style="text-align:center; margin-bottom:20px; padding-bottom:16px; border-bottom:2px solid #1e40af;">
    <div style="font-size:13px; color:#64748b; font-weight:600; letter-spacing:1px; text-transform:uppercase;">
      Institut National Polytechnique Félix Houphouët-Boigny
    </div>
    <div style="font-size:22px; font-weight:bold; color:#1e40af; margin:6px 0;">
      Bulletin de Notes — ${semestre?.libelle ?? ''}
    </div>
    <div style="font-size:12px; color:#64748b;">Année universitaire : ${semestre?.anneeUniversitaire ?? ''}</div>
  </div>

  <!-- INFOS ÉTUDIANT -->
  <div style="background:#f1f5f9; border-radius:8px; padding:12px 16px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:8px;">
    <div style="flex:1; min-width:200px;">
      <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Nom & Prénom</div>
      <div style="font-size:14px; font-weight:bold;">${etudiant?.nom ?? ''} ${etudiant?.prenom ?? ''}</div>
    </div>
    <div style="flex:1; min-width:150px;">
      <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Matricule</div>
      <div style="font-size:14px; font-weight:bold;">${etudiant?.matricule ?? ''}</div>
    </div>
    <div style="flex:1; min-width:150px;">
      <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Date de naissance</div>
      <div style="font-size:13px;">${etudiant?.dateNaissance ? new Date(etudiant.dateNaissance).toLocaleDateString('fr-FR') : '—'}</div>
    </div>
    <div style="flex:1; min-width:150px;">
      <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Email</div>
      <div style="font-size:12px;">${etudiant?.email ?? '—'}</div>
    </div>
  </div>

  <!-- UES ET MATIÈRES -->
  <div style="margin-bottom:20px;">
    <div style="font-size:14px; font-weight:bold; color:#1e293b; margin-bottom:12px; padding-bottom:4px; border-bottom:1px solid #e5e7eb;">
      Résultats par Unité d'Enseignement
    </div>
    ${uesHtml || '<p style="color:#64748b; font-style:italic;">Aucune UE disponible.</p>'}
  </div>

  <!-- RÉSULTAT SEMESTRE -->
  ${
    resultat
      ? `<div style="background:${resultat.valide ? '#dcfce7' : '#fee2e2'}; border:1px solid ${resultat.valide ? '#86efac' : '#fca5a5'}; border-radius:8px; padding:16px; margin-bottom:20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
      <div>
        <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Moyenne du semestre</div>
        <div style="font-size:28px; font-weight:bold; color:${resultat.valide ? '#16a34a' : '#dc2626'};">${resultat.moyenneSemestre.toFixed(2)}<span style="font-size:14px; color:#64748b;">/20</span></div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Crédits acquis</div>
        <div style="font-size:22px; font-weight:bold;">${resultat.creditsAcquis ?? 0}<span style="font-size:13px; color:#64748b;">/${resultat.creditsTotal}</span></div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Mention</div>
        <div style="font-size:16px; font-weight:bold; color:${mentionColor};">${mention ?? 'Ajourné'}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Décision</div>
        <div style="font-size:16px; font-weight:bold; color:${resultat.valide ? '#16a34a' : '#dc2626'};">${resultat.valide ? 'VALIDÉ' : 'AJOURNÉ'}</div>
      </div>
    </div>
  </div>`
      : ''
  }

  <!-- STATISTIQUES PROMOTION -->
  ${
    statistiques && statistiques.nbEtudiants > 0
      ? `<div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; margin-bottom:20px;">
    <div style="font-size:12px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Statistiques de la promotion (${statistiques.nbEtudiants} étudiants)</div>
    <div style="display:flex; gap:24px; flex-wrap:wrap; font-size:12px;">
      <span>Moyenne classe : <strong>${statistiques.moyenneClasse?.toFixed(2) ?? '—'}</strong></span>
      <span>Note min : <strong>${statistiques.noteMin?.toFixed(2) ?? '—'}</strong></span>
      <span>Note max : <strong>${statistiques.noteMax?.toFixed(2) ?? '—'}</strong></span>
      <span>Écart-type : <strong>${statistiques.ecartType?.toFixed(2) ?? '—'}</strong></span>
    </div>
  </div>`
      : ''
  }

  <!-- PIED DE PAGE -->
  <div style="text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #e5e7eb; padding-top:10px; margin-top:10px;">
    Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} — Bull ASUR
  </div>

</div>
</body>
</html>`;
  }

  // ─────────────────────────────────────────────
  // HELPERS MENTION
  // ─────────────────────────────────────────────
  private getMention(moyenne: number | null): string | null {
    if (moyenne === null) return null;
    if (moyenne >= 16) return 'Très Bien';
    if (moyenne >= 14) return 'Bien';
    if (moyenne >= 12) return 'Assez Bien';
    if (moyenne >= 10) return 'Passable';
    return null;
  }

  private getMentionColor(mention: string | null): string {
    switch (mention) {
      case 'Très Bien': return '#7c3aed';
      case 'Bien': return '#1d4ed8';
      case 'Assez Bien': return '#0369a1';
      case 'Passable': return '#16a34a';
      default: return '#dc2626';
    }
  }
}
