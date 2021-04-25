import React from 'react'
import {Alert, Nav} from 'react-bootstrap'

import { VerificationInfoServeur } from './Authentification'
import { MenuItems } from './Menu'

import {getCertificats, getClesPrivees} from '../components/pkiHelper'
// import {SignateurTransactionSubtle} from '@dugrema/millegrilles.common/lib/cryptoSubtle'
import {splitPEMCerts} from '@dugrema/millegrilles.common/lib/forgecommon'

import ListeSites from './ListeSites'
import CDNConfig from './ContentDeliveryNetworkConfig'

import './App.css'
import $ from 'jquery'
window.jQuery = $

// import manifest from '../../../manifest.build.js'
var manifestImport = {
  date: "DUMMY-Date",
  version: "DUMMY-Version",
}
// try {
//   manifestImport = require('../../../manifest.build.js')
// } catch(err) {
//   // Ok
// }
const manifest = manifestImport

export class ApplicationPublication extends React.Component {

  state = {
    serveurInfo: null,          // Provient de /coupdoeil/info.json
    idmg: null,                 // IDMG actif
    hebergement: false,

    websocketApp: '',
    // signateurTransaction: '',

    siteId: '',  // Site en cours de modification
    afficherSection: '',
    err: '',
  }

  componentDidMount() {

    const wsa = this.props.rootProps.connexionWorker
    wsa.isFormatteurReady()
      .then( async _ =>{
        console.debug("Formatteur ready sur connexion")
        this.setState({websocketApp: wsa})
      })

  }

  setInfoServeur = (info) => {
    this.setState(info)
  }

  setSiteId = siteId => {
    if(siteId.currentTarget) siteId = siteId.currentTarget.value  // Mapper value bouton
    // console.debug("Set site id : %O", siteId)
    this.setState({siteId})
  }

  changerPage = event => {
    // Retour page accueil
    var afficherSection = event.currentTarget?event.currentTarget.value:event
    this.setState({afficherSection})
  }

  creerSite = async _ => {
    console.debug("Creer nouveau site")
    const domaineAction = 'Publication.majSite'
    var transaction = {}

    // Signer transaction, soumettre
    //const signateurTransaction = this.state.signateurTransaction
    const webWorker = this.props.rootProps.chiffrageWorker
    //await signateurTransaction.preparerTransaction(transaction, domaineAction)
    transaction = await webWorker.formatterMessage(transaction, domaineAction)
    const siteId = transaction['en-tete']['uuid_transaction']
    console.debug("Nouveau site %s, Transaction a soumettre : %O", siteId, transaction)

    const wsa = this.state.websocketApp
    try {
      const reponse = await wsa.majSite(transaction)
      this.setState({siteId})
    } catch (err) {
      this.setState({err})
    }
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  setAfficherSection = event => {
    const afficherSection = event.currentTarget?event.currentTarget.value:event
    this.setState({afficherSection})
  }

  retour = _ => {
    this.setState({afficherSection: ''})
  }

  render() {

    const rootProps = {
      ...this.props, ...this.props.rootProps, ...this.state,
      manifest,
      changerPage: this.changerPage,
      setSiteId: this.setSiteId,
    }

    let page;
    if(!this.state.serveurInfo) {
      // 1. Recuperer information du serveur
      page = <VerificationInfoServeur setInfoServeur={this.setInfoServeur} />
    } else if(!this.state.websocketApp) {
      // 2. Connecter avec Socket.IO
      page = <p>Attente de connexion</p>
    } else {

      var ElementPage = null
      switch(this.state.afficherSection) {
        case 'cdnConfig':
          ElementPage = CDNConfig; break
        case 'listeSites':
          ElementPage = ListeSites; break
        default:
          ElementPage = ChoisirSection
      }

      page = <ElementPage rootProps={rootProps}
                          setAfficherSection={this.setAfficherSection}
                          retour={this.retour} />
    }

    // if(this.state.afficherSection === 'cdnConfig') {
    //   // Editer un site selectionne
    //   page = <CDNConfig rootProps={rootProps}
    //                     siteId={this.state.siteId}
    //                     retour={this.retour} />
    // } else if(this.state.afficherSection === 'editerSite') {
    //   // Editer un site selectionne
    //   page = <EditerSite rootProps={rootProps}
    //                      siteId={this.state.siteId}
    //                      retour={this.retour} />
    // } else if(this.state.afficherSection === 'listeSites') {
    //   // Afficher la liste des sites
    //   page = <ListeSites rootProps={rootProps}
    //                      setSiteId={this.setSiteId}
    //                      creerSite={this.creerSite} />
    // } else {
    //
    // }

    return (
      <>
        <AlertErreur err={this.state.err} clearErreur={this.clearErreur}/>
        {page}
      </>
    )
  }

}

function ChoisirSection(props) {
  return (
    <>
      <h2>Publication</h2>

      <p>Choisir une section</p>

      <Nav onSelect={props.setAfficherSection}>
        <Nav.Link eventKey="listeSites">Sites</Nav.Link>
        <Nav.Link eventKey="cdnConfig">Destinations Content Delivery Network</Nav.Link>
      </Nav>

    </>
  )
}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err!==''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{''+props.err}</pre>
    </Alert>
  )
}
