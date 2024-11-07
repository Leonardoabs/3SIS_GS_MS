from fastapi import APIRouter, Depends
from worker import celery_worker
from celery.result import AsyncResult
from app.models.diploma_model import DiplomaModel
from app.views.diploma_view import DiplomaView
import uuid
import os
import redis

router = APIRouter()

cache = redis.Redis.from_url("redis://redis:6379/0")

@router.post("/generate_diploma")
async def generate_diploma(data: dict, diploma_model: DiplomaModel = Depends(), diploma_view: DiplomaView = Depends()):
    key = str(uuid.uuid3(uuid.NAMESPACE_DNS, f"{data['nome_aluno']}{data['curso']}"))
    path = os.path.join(os.getcwd(), f"diplomas/{key}.pdf")

    # Verifica se o diploma já está em cache
    cached_path = cache.get(key)
    if cached_path:
        return diploma_view.send_pdf(cached_path.decode())

    # Verifica se o diploma já existe no banco de dados
    db_diploma = diploma_model.get_diploma_by_path(path)
    if db_diploma:
        cache.set(key, db_diploma["path"], ex=60)
        return diploma_view.send_pdf(db_diploma["path"])

    # Se não encontrado, chama o worker para gerar o diploma
    task = celery_worker.send_task("generate_diploma", args=[data])
    task_result = AsyncResult(id=task.id, app=celery_worker).get()

    # Salva o diploma no banco e retorna o PDF
    diploma_model.save_diploma(data)
    return diploma_view.send_pdf(task_result["path"])
