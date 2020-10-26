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
import requests
from bs4 import BeautifulSoup
import time

import csv                  
import webbrowser
import io

import pandas as pd
import numpy as np
```

```python
def get_soup(url, show=False):
    r = requests.get(url)
    if r.status_code != 200: # not OK
        print('[get_soup] status code:', r.status_code)
    else:
        return BeautifulSoup(r.text, 'lxml')
    
def post_soup(session, url, params, show=False):
    '''Read HTML from server and convert to Soup'''

    r = session.post(url, data=params)
    
    if show:
        display(r.content, 'temp.html')

    if r.status_code != 200: # not OK
        print('[post_soup] status code:', r.status_code)
    else:
        return BeautifulSoup(r.text, 'lxml')
```

```python
def crawl(airline, url, stop=420):
    n = 1
    _url = url
    reviews = pd.DataFrame(columns=["date", "rating", "review"])
    while n <= stop or not _url:
        soup = get_soup(_url)
        reviews = pd.concat([reviews, get_reviews(soup)])
        _url = get_next_page_link(soup, n)
        n += 1
        time.sleep(1.5)
    reviews["airline"] = airline
    return reviews


def get_reviews(soup):
    review_containers = soup.find_all("div", class_="review-container")
    reviews_on_page = pd.DataFrame(columns=["date", "rating", "review"])
    for rc in review_containers:
        _rating = rc.find("span", class_="ui_bubble_rating").get("class")[1]
        _date = rc.find("span", class_="ratingDate").get("title")
        _review = rc.find("div",class_="prw_reviews_text_summary_hsx").text
        
        reviews_on_page = reviews_on_page.append({
            'date': _date,
            'rating': _rating,
            'review': _review,
        }, ignore_index=True)        
    
    return reviews_on_page
    
def get_next_page_link(soup, curr_page_num):
    def format_link(link):
        return f"https://www.tripadvisor.com{link}"
    
    review_pages = soup.find("div", class_="pageNumbers").find_all("a")
    for p in review_pages:
        page_number = p.text
        if not page_number.isnumeric():
            continue
        if int(page_number) == curr_page_num + 1:
            return format_link(p.get("href"))
    return None
```

```python
airline_urls = {
    'american': 'https://www.tripadvisor.com/ShowUserReviews-g1-d8729020-r775183324-American_Airlines-World.html',
    "alaska": "https://www.tripadvisor.com/ShowUserReviews-g1-d8729017-r775132558-Alaska_Airlines-World.html",
    "united": "https://www.tripadvisor.com/ShowUserReviews-g1-d8729177-r775048840-United_Airlines-World.html",
    "delta": "https://www.tripadvisor.com/ShowUserReviews-g1-d8729060-r774920572-Delta_Air_Lines-World.html",
    "virgin":"https://www.tripadvisor.com/ShowUserReviews-g1-d8729182-r773579224-Virgin_Atlantic_Airways-World.html",
    "hawaiian":"https://www.tripadvisor.com/ShowUserReviews-g1-d8729086-r773220623-Hawaiian_Airlines-World.html",
}
```

```python
american = crawl("american",airline_urls['american'])
american.to_csv('output/american_reviews.csv',index=False)
```

```python
alaska = crawl("alaska",airline_urls['alaska'])
alaska.to_csv('output/alaska_reviews.csv',index=False)
```

```python
united = crawl("united",airline_urls['united'])
united.to_csv('output/united_reviews.csv',index=False)
```

```python
delta = crawl("delta",airline_urls['delta'])
delta.to_csv('output/delta_reviews.csv',index=False)
```

```python
virgin = crawl("virgin",airline_urls['virgin'])
virgin.to_csv('output/virgin_reviews.csv',index=False)
```

```python
hawaiian = crawl("hawaiian",airline_urls['hawaiian'])
hawaiian.to_csv('output/hawaiian_reviews.csv',index=False)
```
