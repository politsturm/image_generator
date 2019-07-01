FROM python:3.7
EXPOSE 8000
CMD python -m http.server --cgi
