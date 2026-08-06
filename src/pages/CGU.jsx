import { useNavigate, Link } from 'react-router-dom';

export default function CGU() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-50 px-5 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 sm:p-10 shadow-card">
        <div className="mb-6">
          <span className="mb-4 inline-block cursor-pointer text-sm font-semibold text-accent-600 hover:text-accent-700" onClick={() => navigate(-1)}>← Retour</span>
          <h1 className="text-2xl font-extrabold text-slate-900">Conditions Générales d'Utilisation &amp; Politique de Confidentialité</h1>
          <p className="mt-2 text-sm text-slate-400">Dernière mise à jour : à compléter avant publication</p>
        </div>

        <div className="mb-7 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
          ⚠️ <strong>Document de travail — non validé juridiquement.</strong> Ce texte est une base
          de départ raisonnable, rédigée pour couvrir les points essentiels d'une plateforme comme
          RentEasy Bénin (gestion locative, paiements, Mobile Money, commission). Il doit être relu
          et adapté par un juriste habilité à exercer au Bénin avant toute mise en production réelle
          — notamment concernant : la réglementation BCEAO applicable à l'intermédiation de
          paiements, la protection des données personnelles (loi béninoise applicable), et le droit
          des baux locatifs.
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">1. Objet</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            RentEasy Bénin est une plateforme de gestion locative qui met en relation propriétaires,
            locataires et agents immobiliers, et qui facilite l'encaissement des loyers (espèces,
            virement, Mobile Money) ainsi que leur reversement aux propriétaires, moyennant une
            commission sur chaque paiement traité.
          </p>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            RentEasy Bénin n'est pas partie aux contrats de bail conclus entre propriétaires et
            locataires : la plateforme fournit les outils de gestion, de génération de documents et
            d'encaissement, mais la relation contractuelle de location reste entre les deux parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">2. Comptes et rôles</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            La plateforme distingue plusieurs types de comptes : propriétaire, locataire, agent
            immobilier, administrateur. Chaque personne est responsable de la confidentialité de son
            mot de passe et de toute action effectuée depuis son compte. Un compte doit être créé
            avec des informations exactes ; RentEasy Bénin se réserve le droit de suspendre un compte
            fournissant des informations fausses ou trompeuses.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">3. Paiements, commission et Mobile Money</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            Une commission, dont le taux est affiché dans l'application et peut évoluer, est prélevée
            par RentEasy Bénin sur chaque paiement de loyer traité via la plateforme. Les paiements
            par Mobile Money sont traités via les opérateurs partenaires (MTN, Moov, Celtiis) ; RentEasy
            Bénin ne stocke aucune information de paiement sensible (code PIN, identifiants bancaires)
            — seules les références de transaction fournies par l'opérateur sont conservées.
          </p>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            En cas d'échec ou de blocage d'un paiement, la plateforme met en œuvre des vérifications
            automatiques périodiques ; tout litige persistant peut être signalé au support RentEasy
            Bénin.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">4. Annonces sur le marché locatif</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            Tout propriétaire publiant une annonce sur le marché RentEasy est responsable de
            l'exactitude des informations et photos publiées. RentEasy Bénin se réserve le droit de
            retirer, avec motif communiqué au propriétaire, toute annonce jugée inappropriée,
            trompeuse ou non conforme (photos non représentatives, coordonnées erronées, doublons,
            contenu offensant).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">5. Données personnelles</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            RentEasy Bénin collecte les données nécessaires à la fourniture du service : identité,
            coordonnées, informations sur les biens et contrats de location, historique de paiement.
            Ces données sont utilisées pour la gestion des comptes, le traitement des paiements, la
            génération de documents (contrats, quittances) et l'amélioration du service. Elles ne
            sont pas vendues à des tiers. Elles peuvent être partagées avec les opérateurs Mobile
            Money strictement dans le cadre du traitement d'un paiement initié par l'utilisateur.
          </p>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            Toute personne peut demander l'accès, la rectification ou la suppression de ses données
            en contactant le support RentEasy Bénin, dans les limites imposées par les obligations
            légales de conservation (notamment comptables et fiscales).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">6. Résiliation</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            Un utilisateur peut demander la clôture de son compte à tout moment. RentEasy Bénin peut
            suspendre ou clôturer un compte en cas de non-respect des présentes conditions, de fraude
            avérée ou de non-paiement des commissions dues.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-slate-900">7. Responsabilité</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            RentEasy Bénin s'efforce d'assurer la disponibilité et la fiabilité de la plateforme, sans
            garantie de disponibilité continue. La plateforme ne peut être tenue responsable des
            litiges relatifs à l'état d'un bien, au respect d'un contrat de bail, ou aux délais de
            traitement propres aux opérateurs Mobile Money partenaires.
          </p>
        </section>

        <section className="mb-2">
          <h2 className="mb-2 text-base font-bold text-slate-900">8. Contact</h2>
          <p className="mb-2.5 text-sm leading-relaxed text-slate-700">
            Pour toute question relative aux présentes conditions ou à vos données personnelles, contactez le support RentEasy Bénin depuis votre espace, ou via la{' '}
            <Link to="/contact" className="font-semibold text-accent-600 hover:text-accent-700">page Contact</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
