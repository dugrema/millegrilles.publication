import React, {useState, useEffect} from 'react'
import {Row, Col, Button, ButtonGroup, Form, FormControl, InputGroup, Alert} from 'react-bootstrap'

export default class InfoSite extends React.Component {

  state = {
    // Champs d'edition a l'ecran
    nom_site: '',
    languages: '',
    titre: '',
    listeCdn: '',

    err: '',
    confirmation: '',
  }

  messageRecu = event => {
    console.debug("Message MQ recu : %O", event)

    const message = event.message,
          routingKey = event.routingKey
    const action = routingKey.split('.').pop()

    if(action === 'majSite' && this.props.siteId === message.site_id) {
      console.debug("Modifier site avec transaction : %O", message)
      const siteModifie = {...this.state.site, ...message}
      this.setState({site: siteModifie}, _=>{console.debug("MAJ apres update : %O", this.state)})
    }
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  changerChampMultilingue = event => {
    const {name, value} = event.currentTarget
    var langue = event.currentTarget.dataset.langue
    // console.debug("Changer champ multilingue %s, langue:%s = %s", name, langue, value)

    var valeur = this.state[name] || this.props.site[name]
    this.setState({[name]: {...valeur, [langue]: value}})
  }

  ajouterCdn = cdnId => {
    if(!cdnId) return
    console.debug("Ajouter cdn %O", cdnId)
    const listeCdn = this.state.listeCdn || this.props.site.listeCdn || []
    if(!listeCdn.includes(cdnId)) listeCdn.push(cdnId)
    this.setState({listeCdn})
  }

  retirerCdn = event => {
    const cdnId = event.currentTarget.value
    console.debug("Retirer cdn %O", cdnId)
    var listeCdn = this.state.listeCdn || this.props.site.listeCdn || []
    listeCdn = listeCdn.filter(cdnIdListe=>cdnIdListe !== cdnId)
    this.setState({listeCdn})
  }

  changerPositionCdn = (cdnId, nouvellePosition) => {
    // console.debug("Changer position cdn %s vers %d", cdnId, nouvellePosition)
    var listeCdn = this.state.listeCdn || this.props.site.listeCdn || []

    var nouvelleListeCdn = [...listeCdn]                            // Shallow copy
    nouvelleListeCdn = nouvelleListeCdn.filter(item=>item!==cdnId)  // Retirer element
    nouvelleListeCdn.splice(nouvellePosition, 0, cdnId)             // Mettre element a la nouvelle position

    this.setState({listeCdn: nouvelleListeCdn})
  }

  resetChamps = _ => {
    this.setState({
      nom: '', listeCdn: '',
    })
  }

  ajouterLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.props.site.languages || []
    }

    // Dedupe
    const dictLanguages = {}
    languages = [...languages, language].filter(item=>{
      if(dictLanguages[item]) return false
      dictLanguages[item] = true
      return true
    })

    console.debug("Nouvelle liste languages : %O", languages)

    // Initialiser les champs multilingues au besoin
    const valeursMultilingues = {}

    const listeChamps = ['titre']

    listeChamps.forEach(item=>{
      var coll = {}
      languages.forEach(lang=>{coll[lang]=''})
      const valeursExistantes = this.state[item] || this.props.site[item]
      coll = {...coll, ...valeursExistantes}
      valeursMultilingues[item] = coll
    })

    this.setState({languages, ...valeursMultilingues}, _=>{console.debug("State : %O", this.state)})
  }

  supprimerLanguage = language => {
    if(language.currentTarget) language = language.currentTarget.value
    console.debug("Supprimer language : %s", language)
    var languages = this.state.languages
    if(!languages) {
      // Copier languages du site si existant
      languages = this.props.site.languages || []
    }

    // Supprimer (filtrer) entree
    languages = languages.filter(item=>item !== language)
    this.setState({languages})
  }

  // ajouterNoeud = noeudId => {
  //   var nouveauNoeud = noeudId
  //   console.debug("Ajouter noeud %s", nouveauNoeud)
  //
  //   var noeuds = this.state.noeuds_urls
  //   if( ! noeuds ) {
  //     noeuds = this.props.noeuds_urls || {}
  //   }
  //
  //   noeuds[nouveauNoeud] = []
  //   this.setState({noeuds_urls: noeuds, noeud_id: ''}, _=>{console.debug("Ajout noeud, state : %O", this.state)})
  // }
  //
  // ajouterUrl = (noeudId, url) => {
  //   console.debug("Ajouter url %s a noeudId %s", url, noeudId)
  //   var noeuds_urls = this.state.noeuds_urls || this.props.site.noeuds_urls
  //
  //   var urls = noeuds_urls[noeudId] || []
  //   urls.push(url)
  //   noeuds_urls[noeudId] = urls
  //
  //   this.setState({noeuds_urls})
  // }
  //
  // supprimerUrl = (noeudId, url) => {
  //   console.debug("Ajouter url %s a noeudId %s", url, noeudId)
  //   var noeuds_urls = this.state.noeuds_urls || this.props.site.noeuds_urls
  //
  //   var urls = noeuds_urls[noeudId] || []
  //   urls = urls.filter(item=>item!==url)
  //   noeuds_urls[noeudId] = urls
  //
  //   this.setState({noeuds_urls})
  // }

  sauvegarder = async event => {
    console.debug("Sauvegarder changements formulaire site")

    // Conserver changements au formulaire
    const domaineAction = 'Publication.majSite'
    var transaction = {}

    const champsFormulaire = ['nom_site', 'languages', 'titre', 'listeCdn']

    champsFormulaire.forEach(item=>{
      if(this.state[item]) transaction[item] = this.state[item]
    })

    if(Object.keys(transaction).length === 0) {
      console.debug("Aucun changement au formulaire")
      return
    }

    transaction['site_id'] = this.props.siteId

    try {
      // const signateurTransaction = this.props.rootProps.signateurTransaction
      // await signateurTransaction.preparerTransaction(transaction, domaineAction)
      const webWorker = this.props.rootProps.chiffrageWorker
      transaction = await webWorker.formatterMessage(transaction, domaineAction)
      const siteId = transaction['en-tete']['uuid_transaction']
      console.debug("Maj site %s, Transaction a soumettre : %O", siteId, transaction)

      const wsa = this.props.rootProps.websocketApp
      const reponse = await wsa.majSite(transaction)
      const valeursReset = {}
      champsFormulaire.forEach(item=>{
        valeursReset[item] = ''
      })

      this.setState(valeursReset, _=>{
        console.debug("MAJ apres update : %O", this.state)
        this.setState({confirmation: "Mise a jour du site reussie"})
      })
    } catch (err) {
      this.setState({err})
    }
  }

  clearErreur = _ => {
    this.setState({err: ''})
  }

  clearConfirmation = _ => {
    this.setState({confirmation: ''})
  }

  render() {
    if(!this.props.site) return <ChargementEnCours />

    return (
      <>
        <AlertErreur err={this.state.err} clearErreur={this.clearErreur} />
        <AlertConfirmation confirmation={this.state.confirmation} clearConfirmation={this.clearConfirmation} />

        <FormInfoSite   changerChamp={this.changerChamp}
                        changerChampMultilingue={this.changerChampMultilingue}
                        ajouterLanguage={this.ajouterLanguage}
                        supprimerLanguage={this.supprimerLanguage}
                        ajouterNoeud={this.ajouterNoeud}
                        ajouterUrl={this.ajouterUrl}
                        ajouterCdn={this.ajouterCdn}
                        retirerCdn={this.retirerCdn}
                        changerPositionCdn={this.changerPositionCdn}
                        supprimerUrl={this.supprimerUrl}
                        {...this.props}
                        {...this.state} />

        <Row>
          <Col className="row-padtop bouton-serie">
            <Button onClick={this.sauvegarder}
                    disabled={!this.props.rootProps.modeProtege}>
              Sauvegarder
            </Button>
            <Button variant="secondary"
                    onClick={this.props.retour}>
              Retour
            </Button>
          </Col>
        </Row>
      </>
    )
  }

}

function ChargementEnCours(props) {
  return <p>Chargement en cours</p>
}

function FormInfoSite(props) {

  var nomSite = props.nom_site
  if(!nomSite && props.site.nom_site) {
    nomSite = props.site.nom_site
  }

  return (
    <Form>

      <Form.Group>
        <Form.Label md={3}>Identificateur unique</Form.Label>
        <div>{props.siteId}</div>
      </Form.Group>

      <Form.Group>
        <Form.Label htmlFor='nom_site'>Nom site</Form.Label>
        <Form.Control name='nom_site' id='nom_site'
                      value={nomSite}
                      onChange={props.changerChamp} />
        <Form.Text className="text-muted">Reference interne, ce nom n'est pas affiche sur le site.</Form.Text>
      </Form.Group>

      <Languages {...props} />

      <TitreSite languages={props.languages || props.site.languages}
                 titre={props.titre || props.site.titre}
                 changerChampMultilingue={props.changerChampMultilingue} />

      <ListeCDN rootProps={props.rootProps}
                site={props.site}
                listeCdn={props.listeCdn}
                ajouterCdn={props.ajouterCdn}
                retirerCdn={props.retirerCdn}
                changerPositionCdn={props.changerPositionCdn} />

    </Form>
  )
}

class Languages extends React.Component {

  state = {
    nouveauLanguage: '',
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  ajouterLanguage = event => {
    this.props.ajouterLanguage(event.currentTarget.value)
    this.setState({nouveauLanguage: ''})
  }

  render() {

    const languages = this.props.languages || this.props.site.languages
    var renderedLanguages = ''
    if(languages) {
      renderedLanguages = languages.map(item=>{
        return <Button key={item} variant="secondary" onClick={this.props.supprimerLanguage} value={item}>{item} <i className="fa fa-close"/></Button>
      })
    }

    return (
      <>
        <Form.Row>
          <Form.Group as={Col} md={5} lg={4}>
            <Form.Label htmlFor="language">Languages</Form.Label>
            <InputGroup>
              <FormControl name="nouveauLanguage"
                           value={this.state.nouveauLanguage}
                           onChange={this.changerChamp} />
              <InputGroup.Append>
                <Button variant="outline-secondary"
                        onClick={this.ajouterLanguage}
                        value={this.state.nouveauLanguage}>Ajouter</Button>
              </InputGroup.Append>
              <Form.Text className="text-muted">
                Ajouter les languages sous format ISO 639-1 (fr=francais, en=anglais, es=espagnol)
              </Form.Text>
            </InputGroup>
          </Form.Group>

          <Col>
            <Form.Label>Languages selectionnes</Form.Label>
            <div>{renderedLanguages}</div>
          </Col>

        </Form.Row>

      </>
    )
  }

}

function TitreSite(props) {
  return (
    <Form.Group>
      <Form.Label>Titre</Form.Label>
      <ChampInputMultilingue languages={props.languages}
                             name="titre"
                             values={props.titre}
                             changerChamp={props.changerChampMultilingue} />
      <Form.Text className="text-muted">Titre affiche sur le site</Form.Text>
    </Form.Group>
  )
}

export function ChampInputMultilingue(props) {

  if( ! props.languages || ! props.values ) return ''

  const renderedInput = props.languages.map(langue=>{
    const nomChamp = props.name  // + '_' + langue

    return (
      <InputGroup key={langue}>
        <InputGroup.Prepend>
          <InputGroup.Text>{langue}</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name={nomChamp}
                     value={props.values[langue]}
                     data-row={props.idxRow}
                     data-langue={langue}
                     onChange={props.changerChamp} />
      </InputGroup>
    )
  })

  return renderedInput
}

class Noeuds extends React.Component {

  state = {
    noeud_id: '',
  }

  selectionnerNoeud = event => {
    const noeud_id = event.currentTarget.value
    console.debug("Selectionner noeud %s", noeud_id)
    this.setState({noeud_id})
  }

  ajouterNoeud = event => {
    var noeudId = this.state.noeud_id
    console.debug("Ajouter noeud %s", noeudId)
    this.props.ajouterNoeud(noeudId)
    this.setState({noeud_id: ''}, _=>{console.debug("Ajout noeud, state : %O", this.state)})
  }

  render() {
    const noeuds_urls = this.state.noeuds_urls || this.props.noeuds_urls

    const listeNoeuds = []
    for(const noeudId in noeuds_urls) {
      const listeUrls = noeuds_urls[noeudId]
      var noeudInfo = null
      if(this.props.site) {
        noeudInfo = this.props.site[noeudId]
      }
      listeNoeuds.push(
        <Noeud key={noeudId}
               noeudId={noeudId}
               noeudInfo={noeudInfo}
               noeudsDisponibles={this.props.noeudsDisponibles}
               listeUrls={listeUrls}
               ajouterUrl={this.props.ajouterUrl}
               supprimerUrl={this.props.supprimerUrl} />
      )
    }

    return (
      <>
        <h2>Noeuds pour deploiement</h2>

        <NoeudsDisponibles noeuds={this.props.noeudsDisponibles}
                           selectionnerNoeud={this.selectionnerNoeud}
                           ajouterNoeud={this.ajouterNoeud}/>

        {listeNoeuds}
      </>
    )
  }

}

class Noeud extends React.Component {

  state = {
    nouveauUrl: '',
  }

  ajouterUrl = event => {
    this.props.ajouterUrl(this.props.noeudId, this.state.nouveauUrl)
    this.setState({nouveauUrl: ''})
  }

  supprimerUrl = event => {
    this.props.supprimerUrl(this.props.noeudId, event.currentTarget.value)
  }

  changerChamp = event => {
    const {name, value} = event.currentTarget
    this.setState({[name]: value})
  }

  render() {

    const listeUrls = this.props.listeUrls
    var renderedUrls = ''
    if(listeUrls) {
      renderedUrls = listeUrls.map(item=>{
        return <Button key={item}
                       variant="secondary"
                       onClick={this.supprimerUrl}
                       value={item}>
                  {item} <i className="fa fa-close"/>
               </Button>
      })
    }

    var nomNoeud = this.props.noeudId
    try {
      if(this.props.noeudsDisponibles) {
        var noeudInfo = null
        noeudInfo = this.props.noeudsDisponibles.filter(item=>item.noeud_id===this.props.noeudId)[0]
        if(noeudInfo && noeudInfo.fqdn_detecte) {
          nomNoeud = noeudInfo.fqdn_detecte + " (" + this.props.noeudId + ")"
        }
      }
    } catch(err) {
      console.error("Erreur chargement nom noeud : %O", err)
    }

    return (
      <>
        <Row key={this.props.noeudId}>
          <Col>Noeud {nomNoeud}</Col>
        </Row>
        <Row>
          <Col md={6}>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>URL</InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl name="nouveauUrl" value={this.state.nouveauUrl} onChange={this.changerChamp}/>
              <InputGroup.Append>
                <Button variant="outline-secondary" onClick={this.ajouterUrl}>
                  <i className="fa fa-arrow-right" />
                </Button>
              </InputGroup.Append>
            </InputGroup>
          </Col>
          <Col md={6}>
            {renderedUrls}
          </Col>
        </Row>
      </>
    )
  }
}

function NoeudsDisponibles(props) {

  if( ! props.noeuds ) return ''

  var options = props.noeuds.map(item=>{
    var label = ''
    if(item.fqdn_detecte) {
      label = item.fqdn_detecte + ' (' + item.noeud_id + ')'
    } else {
      label = item.noeud_id
    }
    return <option key={item.noeud_id} value={item.noeud_id}>{label}</option>
  })

  return (
    <Form.Group>
      <label htmlFor="noeuds-disponibles">Ajouter noeud pour deployer le site</label>
      <InputGroup>

        <Form.Control as="select" id="noeuds-disponibles"
                      onChange={props.selectionnerNoeud}>
          <option key='selectionner' value=''>Selectionner un nouveau noeud</option>
          {options}
        </Form.Control>

        <InputGroup.Append>
          <Button variant="outline-secondary"
                  onClick={props.ajouterNoeud}>Ajouter</Button>
        </InputGroup.Append>

      </InputGroup>
    </Form.Group>
  )

}

function ListeCDN(props) {
  const site = props.site,
        listeCdn = props.listeCdn || site.listeCdn || []

  const [listeCdnExistantes, setListeCdnExistantes] = useState('')
  const [cdnSelectionne, setCdnSelectionne] = useState('')
  useEffect(async _=>{
    // Charger la liste des CDNs configures
    chargerListeCdns(props.rootProps.connexionWorker, setListeCdnExistantes)
  }, [])
  const ajouterCdn = cdnId => {
    props.ajouterCdn(cdnSelectionne)
    setCdnSelectionne('')
  }

  var optionsCdns = '',
      cdnAssocies = ''

  if(listeCdnExistantes) {
    // Options pour select (ajouter)
    optionsCdns = listeCdnExistantes.filter(cdn=>!listeCdn.includes(cdn.cdn_id)).map(cdn=>{
      return <option value={cdn.cdn_id}>{cdn.description||cdn.cdn_id}</option>
    })

    // Liste de CDN deja associes au site
    cdnAssocies = listeCdn.map((cdnId, idx)=>{
      const cdn = listeCdnExistantes.filter(item=>item.cdn_id===cdnId)[0]

      return (
        <Row>
          <Col md={9}>{idx+1 + '. '}{cdn.description || cdn.cdn_id}</Col>
          <Col md={3}>
            <ButtonGroup>
              <Button onClick={_=>{props.changerPositionCdn(cdn.cdn_id, idx-1)}} disabled={idx===0} variant="secondary">
                <i className="fa fa-arrow-up" />
              </Button>
              <Button onClick={_=>{props.changerPositionCdn(cdn.cdn_id, idx+1)}}  disabled={idx===listeCdn.length-1} variant="secondary">
                <i className="fa fa-arrow-down" />
              </Button>
              <Button variant="secondary" onClick={props.retirerCdn} value={cdn.cdn_id}>
                <i className="fa fa-close"/>
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
      )
    })
  }

  return (
    <>
      <Form.Group>
        <Form.Row>
          <Form.Label>Liste de Content Distribution Networks</Form.Label>
          <InputGroup>
            <Form.Control as="select" name="cdnId"
                          value={cdnSelectionne}
                          onChange={event=>{setCdnSelectionne(event.currentTarget.value)}}
                          disabled={optionsCdns.length===0}>
              <option>
                { optionsCdns.length > 0?
                    'Selectionner un CDN a ajouter...':
                    'Aucun CDN additionnel disponible'
                }
              </option>
              {optionsCdns}
            </Form.Control>
            <InputGroup.Append>
              <Button variant="outline-secondary" onClick={ajouterCdn} disabled={optionsCdns.length===0}>Ajouter</Button>
            </InputGroup.Append>
          </InputGroup>
        </Form.Row>
        <Form.Text className="text-muted">
          Vous pouvez ajouter a cette liste a l'aide de la section de configuration Content Delivery Network (CDN).
        </Form.Text>
      </Form.Group>

      <Form.Group>
        <Form.Label>Content Distribution Networks associes au site</Form.Label>
        <Form.Text>
          Note : l'ordre des CDN est utilise comme preference par le client
        </Form.Text>
        {cdnAssocies}
      </Form.Group>
    </>
  )
}

async function chargerListeCdns(connexionWorker, setListCdn) {
  const listeCdnRecue = await connexionWorker.requeteListeCdns()
  setListCdn(listeCdnRecue)
}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err !== ''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{'' + props.err}</pre>
    </Alert>
  )
}

function AlertConfirmation(props) {
  return (
    <Alert variant="success" show={props.confirmation !== ''} onClose={props.clearConfirmation} dismissible>
      <Alert.Heading>Operation completee</Alert.Heading>
      <pre>{'' + props.confirmation}</pre>
    </Alert>
  )
}
