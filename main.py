from fastapi import FastAPI
from app.controllers.diploma_controller import router as diploma_router
from app.models.diploma_model import DiplomaModel
from app.views.diploma_view import DiplomaView

app = FastAPI()

# Dependências globais
app.include_router(diploma_router, dependencies=[Depends(DiplomaModel), Depends(DiplomaView)])
