import React from 'react'
import {InputGroup, FormControl, Row, Col} from 'react-bootstrap'
import EditeurSummernote from './EditeurSummernote'

export function RenderChampMultilingue(props) {
  const champ = props.champ
  if(champ) {
    const langues = Object.keys(champ)
    langues.sort()
    return langues.map(l=>''+l+':'+champ[l]).join('/')
  } else {
    return props.defaut || ''
  }
  return ''
}

export function RenderValeursMultilingueRows(props) {
  const champ = props.champ
  if(champ) {
    var langues = props.languages
    if(!langues) {
      // Langues non fournies, on utilise celle connues
      langues = Object.keys(champ)
      langues.sort()
    }
    return langues.map(l=>{
      const valeur = champ[l]
      return (
        <Row key={l}>
          <Col xs={1}>{l}</Col>
          <Col>{valeur}</Col>
        </Row>
      )
    })
  } else {
    return props.defaut || ''
  }
  return ''
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
                     value={props.values[langue] || ''}
                     data-row={props.idxRow}
                     data-langue={langue}
                     onChange={props.changerChamp} />
      </InputGroup>
    )
  })

  return renderedInput
}

export function ChampSummernoteMultilingue(props) {
  // props.name: nom du champ
  // props.languages: liste de languages supportes (e.g. ['fr', 'en'])
  // props.values: dict de valeurs (e.g. {fr: 'Francais', en: 'English'})

  // opts
  // props.langue - affiche seulement la langue en parametre

  const nomChamp = props.name
  if( ! props.languages || ! props.values ) return ''
  var languages = props.langue?[props.langue]:props.languages

  const renderedInput = languages.map(langue=>{

    // <FormControl name={nomChamp}
    //              value={props.values[langue] || ''}
    //              data-langue={langue}
    //              onChange={props.changerChamp} />

    return (
      <InputGroup key={langue}>
        <InputGroup.Prepend>
          <InputGroup.Text>{langue}</InputGroup.Text>
          <EditeurSummernote name={nomChamp}
                             value={props.values[langue] || ''}
                             langue={langue}
                             onChange={props.onChange} />
        </InputGroup.Prepend>
      </InputGroup>
    )
  })

  return renderedInput
}
