@app.get("/")
def root():
	return {"message": "API NativaGo Backoffice funcionando"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from operations_nativago.routers.dashboard.dashboard_router import router as dashboard_router
from operations_nativago.routers.auth_router import router as auth_router
from operations_nativago.routers.user_router import router as user_router
from operations_nativago.routers.experiences.experiences_router import router as experiences_router
from operations_nativago.routers.reservations.reservations_router import router as reservations_router
from operations_nativago.routers.operators.operators_router import router as operators_router
from operations_nativago.routers.notifications.notifications_router import router as notifications_router
from operations_nativago.routers.finance.finance_router import router as finance_router
from operations_nativago.routers.audit.audit_router import router as audit_router

app = FastAPI(title="Operations NativaGo Backoffice")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(experiences_router, prefix="/experiences", tags=["Experiences"])
app.include_router(reservations_router, prefix="/reservations", tags=["Reservations"])
app.include_router(operators_router, prefix="/operators", tags=["Operators"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(finance_router, prefix="/finance", tags=["Finance"])
app.include_router(audit_router, prefix="/audit", tags=["Audit"])
