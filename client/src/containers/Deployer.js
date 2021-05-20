import React, {useState, useEffect} from 'react'
import {Alert, Nav, Row, Col, Button} from 'react-bootstrap'

export default function Deployer(props) {
  return (
    <>
      <h2>Deployer</h2>
      <Button onClick={props.retour}>Retour</Button>

      <BoutonsActions connexionWorker={props.rootProps.connexionWorker}/>

      <RapportEtat connexionWorker={props.rootProps.connexionWorker} />
    </>
  )
}

function BoutonsActions(props) {

  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  const connexionWorker = props.connexionWorker
  const publierChangements = async _ => {
    // console.debug("Publier changements")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.publierChangements()
      console.debug("Confirmation publier changements : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetData = async _ => {
    // console.debug("Reset data")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetData()
      console.debug("Confirmation reset data : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetFichiers = async _ => {
    // console.debug("Reset fichiers")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetFichiers()
      console.debug("Confirmation reset fichiers : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  const resetWebapps = async _ => {
    // console.debug("Reset webapps")
    setConfirmation('')
    setErreur('')
    try {
      const reponse = await connexionWorker.resetWebapps()
      console.debug("Confirmation reset webapps : %O", confirmation)
      setConfirmation('Ok')
    } catch(err) {
      setErreur(''+err)
    }
  }

  return (
    <>
      <h2>Actions globales</h2>

      <Alert variant="success" show={confirmation?true:false}>{''+confirmation}</Alert>
      <Alert variant="danger" show={erreur?true:false}>{''+erreur}</Alert>

      <Row>
        <Col lg={8}>
          Publier tous les changements.
        </Col>
        <Col>
          <Button onClick={publierChangements}>Publier changements</Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          Reset les documents (siteconfig, pages, liste de fichiers). N'affecte pas
          le contenu des fichiers.
        </Col>
        <Col>
          <Button onClick={resetData}>Reset data</Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          Reset les fichiers. Permet de republier tous les fichiers sur tous les CDNs.
        </Col>
        <Col>
          <Button onClick={resetFichiers}>Reset fichiers</Button>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          Reset le code des web apps (vitrine et place). Permet de republier le code sur tous les CDNs.
        </Col>
        <Col>
          <Button onClick={resetWebapps}>Reset webapps</Button>
        </Col>
      </Row>
    </>
  )
}

function RapportEtat(props) {

  const [rapport, setRapport] = useState('')

  useEffect(_=>{
    rafraichirDonnees()
    const timerRafraichissement = setInterval(rafraichirDonnees, 5000)
    return _=> {
      // console.debug("Clear interval %O", timerRafraichissement)
      clearInterval(timerRafraichissement)
    }
  }, [])

  const rafraichirDonnees = async _ => {
    console.debug("Rafraichir donnees")
    const rapport = await props.connexionWorker.getEtatPublication()
    console.debug("Resultat rapport : %O", rapport)
    setRapport(rapport)
  }

  return (
    <>
      <h2>Etat de la publication</h2>

      <AfficherCdns rapport={rapport}
                    connexionWorker={props.connexionWorker} />
    </>
  )
}

function AfficherCdns(props) {

  const [dictCdns, setDictCdns] = useState({})
  useEffect(_=>{
    // Charger metadonnees CDNs (noms)
    chargerCdns(props.connexionWorker, setDictCdns)
  }, [])

  const rapport = props.rapport
  let listeCdns = rapport.cdns || []
  listeCdns = [...listeCdns]
  listeCdns.sort()

  if(listeCdns.length === 0) {
    return (
      <p>Aucune activite en cours</p>
    )
  }

  return listeCdns.map(item=>{
    const infoCdn = dictCdns[item] || ''
    return (
      <div key={item}>
        <h3>{infoCdn.description || item}</h3>

        <AfficherPublicationCdn cdnId={item}
                                rapport={rapport} />
      </div>
    )
  })
}

function AfficherPublicationCdn(props) {
  const cdnId = props.cdnId
  const progres = props.rapport.en_cours[cdnId]

  if(!progres) return ''

  const typeDocuments = Object.keys(progres)
  typeDocuments.sort()

  return typeDocuments.map(item=>{
    const nombreRessources = progres[item]
    return (
      <Row key={item}>
        <Col lg={4}>{item}</Col>
        <Col lg={1}>{nombreRessources}</Col>
      </Row>
    )
  })
}

async function chargerCdns(connexionWorker, setDictCdns) {
  const cdns = await connexionWorker.requeteListeCdns()
  // console.debug("Liste cdns : %O", cdns)

  let dictCdns = {}
  cdns.forEach(item=>{
    dictCdns[item.cdn_id] = item
  })

  setDictCdns(dictCdns)
}
