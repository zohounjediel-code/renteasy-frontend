import { useNavigate, Link } from 'react-router-dom';

export default function CGU() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.conteneur}>
        <div style={s.entete}>
          <span style={s.lienRetour} onClick={() => navigate(-1)}>← Retour</span>
          <h1 style={s.titre}>Conditions Générales d'Utilisation & Politique de Confidentialité</h1>
          <p style={s.dateMaj}>Dernière mise à jour : à compléter avant publication</p>
        </div>

        <div style={s.avertissement}>
          ⚠️ <strong>Document de travail — non validé juridiquement.</strong> Ce texte est une base
          de départ raisonnable, rédigée pour couvrir les points essentiels d'une plateforme comme
          RentEasy Bénin (gestion locative, paiements, Mobile Money, commission). Il doit être relu
          et adapté par un juriste habilité à exercer au Bénin avant toute mise en production réelle
          — notamment concernant : la réglementation BCEAO applicable à l'intermédiation de
          paiements, la protection des données personnelles (loi béninoise applicable), et le droit
          des baux locatifs.
        </div>

        <section style={s.section}>
          <h2 style={s.h2}>1. Objet</h2>
          <p style={s.p}>
            RentEasy Bénin est une plateforme de gestion locative qui met en relation propriétaires,
            locataires et agents immobiliers, et qui facilite l'encaissement des loyers (espèces,
            virement, Mobile Money) ainsi que leur reversement aux propriétaires, moyennant une
            commission sur chaque paiement traité.
          </p>
          <p style={s.p}>
            RentEasy Bénin n'est pas partie aux contrats de bail conclus entre propriétaires et
            locataires : la plateforme fournit les outils de gestion, de génération de documents et
            d'encaissement, mais la relation contractuelle de location reste entre les deux parties.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>2. Comptes et rôles</h2>
          <p style={s.p}>
            La plateforme distingue plusieurs types de comptes : propriétaire, locataire, agent
            immobilier, administrateur. Chaque personne est responsable de la confidentialité de son
            mot de passe et de toute action effectuée depuis son compte. Un compte doit être créé
            avec des informations exactes ; RentEasy Bénin se réserve le droit de suspendre un compte
            fournissant des informations fausses ou trompeuses.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>3. Paiements, commission et Mobile Money</h2>
          <p style={s.p}>
            Une commission, dont le taux est affiché dans l'application et peut évoluer, est prélevée
            par RentEasy Bénin sur chaque paiement de loyer traité via la plateforme. Les paiements
            par Mobile Money sont traités via les opérateurs partenaires (MTN, Moov, Celtiis) ; RentEasy
            Bénin ne stocke aucune information de paiement sensible (code PIN, identifiants bancaires)
            — seules les références de transaction fournies par l'opérateur sont conservées.
          </p>
          <p style={s.p}>
            En cas d'échec ou de blocage d'un paiement, la plateforme met en œuvre des vérifications
            automatiques périodiques ; tout litige persistant peut être signalé au support RentEasy
            Bénin.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>4. Annonces sur le marché locatif</h2>
          <p style={s.p}>
            Tout propriétaire publiant une annonce sur le marché RentEasy est responsable de
            l'exactitude des informations et photos publiées. RentEasy Bénin se réserve le droit de
            retirer, avec motif communiqué au propriétaire, toute annonce jugée inappropriée,
            trompeuse ou non conforme (photos non représentatives, coordonnées erronées, doublons,
            contenu offensant).
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>5. Données personnelles</h2>
          <p style={s.p}>
            RentEasy Bénin collecte les données nécessaires à la fourniture du service : identité,
            coordonnées, informations sur les biens et contrats de location, historique de paiement.
            Ces données sont utilisées pour la gestion des comptes, le traitement des paiements, la
            génération de documents (contrats, quittances) et l'amélioration du service. Elles ne
            sont pas vendues à des tiers. Elles peuvent être partagées avec les opérateurs Mobile
            Money strictement dans le cadre du traitement d'un paiement initié par l'utilisateur.
          </p>
          <p style={s.p}>
            Toute personne peut demander l'accès, la rectification ou la suppression de ses données
            en contactant le support RentEasy Bénin, dans les limites imposées par les obligations
            légales de conservation (notamment comptables et fiscales).
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>6. Résiliation</h2>
          <p style={s.p}>
            Un utilisateur peut demander la clôture de son compte à tout moment. RentEasy Bénin peut
            suspendre ou clôturer un compte en cas de non-respect des présentes conditions, de fraude
            avérée ou de non-paiement des commissions dues.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>7. Responsabilité</h2>
          <p style={s.p}>
            RentEasy Bénin s'efforce d'assurer la disponibilité et la fiabilité de la plateforme, sans
            garantie de disponibilité continue. La plateforme ne peut être tenue responsable des
            litiges relatifs à l'état d'un bien, au respect d'un contrat de bail, ou aux délais de
            traitement propres aux opérateurs Mobile Money partenaires.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>8. Contact</h2>
          <p style={s.p}>
            Pour toute question relative aux présentes conditions ou à vos données personnelles, contactez le support RentEasy Bénin depuis votre espace, ou via la <Link to="/contact" style={s.lien}>page Contact</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#f7f7f9', fontFamily: "'Segoe UI', sans-serif", padding: '40px 20px' },
  conteneur: { maxWidth: '720px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
  entete: { marginBottom: '24px' },
  lienRetour: { color: '#e8a020', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'inline-block', marginBottom: '16px' },
  lien: { color: '#e8a020', fontWeight: '600' },
  titre: { fontSize: '24px', fontWeight: '800', color: '#1a3a5c', margin: '0 0 8px' },
  dateMaj: { color: '#888', fontSize: '13px', margin: 0 },
  avertissement: { background: '#fff7e6', border: '1px solid #f0c674', borderRadius: '8px', padding: '16px', fontSize: '13px', color: '#7a5c10', lineHeight: '1.6', marginBottom: '28px' },
  section: { marginBottom: '22px' },
  h2: { fontSize: '16px', fontWeight: '700', color: '#1a3a5c', marginBottom: '8px' },
  p: { fontSize: '14px', color: '#333', lineHeight: '1.7', margin: '0 0 10px' },
};
