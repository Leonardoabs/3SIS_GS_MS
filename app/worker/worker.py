from celery import Celery
from app.views.diploma_view import DiplomaView

celery_worker = Celery("worker", broker="mongodb://mongodb:27017/queue_diplomas", backend="mongodb://mongodb:27017/queue_diplomas")

@celery_worker.task(name="generate_diploma")
def generate_diploma(data):
    try:
        diploma_view = DiplomaView()
        path = os.path.join(os.getcwd(), f"diplomas/{data['nome_aluno']}_{data['curso']}.pdf")
        return {"from": "worker", "path": diploma_view.render_pdf(data, path)}
    except Exception as e:
        return str(e)
