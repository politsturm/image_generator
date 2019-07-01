FROM python:3.7
EXPOSE 8000
RUN apt-get update && \
    apt-get -y install librsvg2-2 gir1.2-rsvg-2.0 libgirepository1.0-dev && \
    pip install requests pycairo pygobject

RUN pip install wand

CMD python -m http.server --cgi
