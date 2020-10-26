---
jupyter:
  jupytext:
    formats: ipynb,md
    text_representation:
      extension: .md
      format_name: markdown
      format_version: '1.2'
      jupytext_version: 1.6.0
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
---

```python
from bs4 import BeautifulSoup
import requests
import pandas as pd
import numpy as np
```

```python
def scrape_all_zips_reviews(zip_list):
    _pattern = '\((\d) stars?\).*(\d{5}) \|(.*)'
    _columns = ['zip_code', 'date', 'carrier', 'rating', 'review', 'review_zip_code']
    
    all_df = pd.DataFrame(columns=_columns)
    for _zc in zip_list:
        _zip_df = pd.DataFrame(columns=_columns)
        for i in range(1,6):
            source = requests.get(f'https://www.cellreception.com/search.php?zip={_zc}&page={i}')
            if source.status_code == 404:
                break
                
            html = source.text
            soup = BeautifulSoup(html, 'lxml')        
            
            review_blocks = soup.findAll(
                lambda tag: tag.name=='div' and 
                tag.has_attr('itemtype') and 
                tag['itemtype']=="http://data-vocabulary.org/Review"
            )
       
            if review_blocks == None:
                continue
            
            for _rb in review_blocks:
                _carrier = _rb.find('h2').text
                _info = _rb.find('em').text
                _review = _rb.find('p').text
                
                if _info == None:
                    continue
                _info = _info.replace("\n",'')
                
                m = re.search(_pattern, _info)
                if m is not None:
                    
                    _stars = m.group(1)
                    _review_zip_code = m.group(2)
                    _date = m.group(3)
                    
                    _zip_df = _zip_df.append({
                        'zip_code': _zc,
                        'date': _date,
                        'carrier': _carrier,
                        'rating': _stars,
                        'review': _review,
                        'review_zip_code': _review_zip_code,
                    }, ignore_index=True)
        
        all_df = pd.concat([all_df, _zip_df])
        
    return all_df
```

## Scrape overall carrier reviews per zip

```python
to_scrape = pd.read_csv('sample_zips_to_scrape.csv', dtype={'zip': str})
to_scrape_list = list(to_scrape['zip'])

def scrape_all_zips():
    pattern = '(Verizon|AT&T|Sprint|T-Mobile) \((\d*\.?\d*) stars \| (\d*) Reviews\)'
    all_df = pd.DataFrame(columns=['zip_code', 'carrier', 'num_stars', 'num_reviews'])
    for _zc in to_scrape_list:
        source = requests.get(f'https://www.cellreception.com/search.php?zip={_zc}&page=1').text
        soup = BeautifulSoup(source, 'lxml')
        
        table = soup.find(
            lambda tag: tag.name=='div' and 
            tag.has_attr('itemtype') and 
            tag['itemtype']=="http://data-vocabulary.org/Review-aggregate"
        )

        if table == None:
            continue
        
        rows = table.findAll(lambda tag: tag.name=='tr')
        
        if rows == None:
            continue
        
        parsed_rows = [row.text.replace("\n",'') for row in rows]

        zip_df = pd.DataFrame(columns=['zip_code', 'carrier', 'num_stars', 'num_reviews'])
        for r in parsed_rows[1:]:
            m = re.search(pattern, r)
            if m is not None:
                _carrier = m.group(1)
                _stars = m.group(2)
                _reviews = m.group(3)
                zip_df = zip_df.append({
                    'zip_code': _zc,
                    'carrier': _carrier, 
                    'num_stars': _stars, 
                    'num_reviews': _reviews
                } , ignore_index=True)
        all_df = pd.concat([all_df, zip_df])
        
    return all_df
```

```python
results = scrape_all_zips()
results.to_csv('cellular_scraped_LW.csv', index=False)
```
