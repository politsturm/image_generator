FROM python:3.7
EXPOSE 8000
RUN pip install requests
CMD python -m http.server --cgi
