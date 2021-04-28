import React from 'react'
import {InputGroup, FormControl} from 'react-bootstrap'

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

  // props.languages: liste de languages supportes (e.g. ['fr', 'en'])
  // props.values: dict de valeurs (e.g. {fr: 'Francais', en: 'English'})
  if( ! props.languages || ! props.values ) return ''

  // props.langue - affiche seulement la langue en parametre
  var languages = props.langue?[props.langue]:props.languages

  const renderedInput = languages.map(langue=>{
    const nomChamp = props.name  // + '_' + langue

    return (
      <InputGroup key={langue}>
        <InputGroup.Prepend>
          <InputGroup.Text>{langue}</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl name={nomChamp}
                     value={props.values[langue] || ''}
                     data-langue={langue}
                     onChange={props.changerChamp} />
      </InputGroup>
    )
  })

  return renderedInput
}
