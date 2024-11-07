from fastapi.responses import FileResponse
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

class DiplomaView:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader("templates"))
        self.template = self.env.get_template("template.html")

    def render_pdf(self, data, path):
        populated = self.template.render(data)
        with open(path, "w+b") as output_file:
            pisa.CreatePDF(populated, dest=output_file)
        return path

    def send_pdf(self, path):
        return FileResponse(path=path, media_type='application/pdf', status_code=200, content_disposition_type="attachment", filename=os.path.basename(path))
