/*
 * Copyright Algodex VASP (BVI) Corp., 2022
 * All Rights Reserved.
 */

import React, { useEffect, useState } from 'react'

//mui files
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

//Lib files
import Helper from '@/lib/helper'

export const AssetSearchInput = ({ setAssetId, parentProp, defaultValue }) => {
  const [query, setQuery] = useState('')
  const [suggestedAssets, setSuggestedAssets] = useState([])
  const [timer, setTimer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [assetValue, setAssetValue] = useState(null)

  const fetchData = () => {
    clearTimeout(timer)
    const newTimer = setTimeout(async () => {
      setLoading(true)
      const res = await Helper.searchAlgoAssets(query.trim())
      setLoading(false)
      const list = [...res.data.assets].filter((asset) => !asset.destroyed)
      if (list.length == 1) {
        setAssetId(list[0].id)
      }
      setSuggestedAssets(
        list.map((asset) => {
          return { ...asset, name: `${asset.id} - ${asset.name}` }
        })
      )
    }, 500)
    setTimer(newTimer)
  }

  useEffect(() => {
    if (query.split('').length > 2) {
      fetchData()
    }
  }, [query])

  return (
    <Autocomplete
      disablePortal
      getOptionLabel={(option) => option.name}
      options={suggestedAssets}
      loading={loading}
      filterOptions={(x) => x}
      value={suggestedAssets.length == 1 ? suggestedAssets[0] : assetValue}
      defaultValue={
        defaultValue
          ? {
            id: defaultValue,
            name: defaultValue,
          }
          : null
      }
      onChange={(event, value) => {
        parentProp.onChange(value?.id || '')
        setAssetId(value?.id || '')
        setAssetValue(value)
      }}
      renderOption={(props, option) => (
        <Box
          component="li"
          sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
          {...props}
        >
          {option.name}
          {option.verification && (
            <>
              {option.verification.reputation == 'Verified' && (
                <VerifiedUserIcon
                  fontSize="10px"
                  sx={{ marginLeft: 2, color: 'info.main' }}
                />
              )}
              {(option.verification.reputation == 'Notable' ||
                option.verification.reputation == 'Neutral') && (
                <CheckCircleIcon
                  fontSize="10px"
                  sx={{ marginLeft: 2, color: 'info.success' }}
                />
              )}
            </>
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="primary" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          data-testid="assetId-input"
          required
          id="outlined-required"
          name="AssetId"
          label="Asset Id"
          value={query.trim()}
          onChange={({ target: { value } }) => {
            setQuery(value)
          }}
        />
      )}
    />
  )
}
