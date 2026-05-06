---
title: "SQL"
author: "Paula Buitrago Velandia"
description: "Scripts SQL avanzado: Taller 1 con transacciones ACID, CTEs, funciones analíticas y auditoría."
image:
  url: "../../assets/images/4.jpg"
  alt: "The word astro against an illustration of planets and stars."
pubDate: 2024-02-07
tags: ["BD2", "SQL", "ACID"]
---

Colección de scripts SQL desarrollados durante el semestre, organizados por tema y nivel de complejidad.

---

## 1. Taller Aplicado — SQL Avanzado y Transacciones ACID

**Integrantes:** Paula Valeria Buitrago Velandia · Sergio Andrés Mahecha Rodríguez  
**Fecha:** 08/04/2026 · **Variante:** 2

Este taller trabaja sobre el esquema HR de Oracle, aplicando ajustes salariales con validaciones ACID completas.

---

### 1.1 Setup del Entorno

Script que prepara las tablas de trabajo copiando el esquema HR, crea la tabla de auditoría, la secuencia y la tabla de variantes con sus 4 configuraciones.

```sql
-- =====================================================================
-- 01_setup_taller1.sql
-- Taller aplicado 1 - SQL avanzado + Transacciones (ACID)
-- AUTOR: Paula Buitrago / Sergio Mahecha
-- FECHA: 08/04/2026
-- DESCRIPCIÓN: Crea copias de las tablas HR, tabla de auditoría,
--              secuencia y tabla de variantes del taller.
-- =====================================================================

SET SERVEROUTPUT ON
WHENEVER SQLERROR CONTINUE

-- Eliminamos objetos previos si ya existen (limpieza segura)
BEGIN EXECUTE IMMEDIATE 'DROP TABLE audit_salary_adjustments_t1 PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE audit_salary_adj_t1_seq'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE t1_variants PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE t1_job_history PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE t1_employees PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE t1_departments PURGE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Creamos copias de trabajo del esquema HR
CREATE TABLE t1_departments AS SELECT * FROM departments;
ALTER TABLE t1_departments ADD CONSTRAINT pk_t1_departments PRIMARY KEY (department_id);

CREATE TABLE t1_employees AS SELECT * FROM employees;
ALTER TABLE t1_employees ADD CONSTRAINT pk_t1_employees PRIMARY KEY (employee_id);

CREATE TABLE t1_job_history AS SELECT * FROM job_history;
ALTER TABLE t1_job_history ADD CONSTRAINT pk_t1_job_history PRIMARY KEY (employee_id, start_date);

-- Tabla de auditoría: registra cada ajuste salarial ejecutado
CREATE TABLE audit_salary_adjustments_t1 (
    audit_id               NUMBER        NOT NULL,
    execution_tag          VARCHAR2(30)  NOT NULL,   -- Identifica la ejecución
    variant_id             NUMBER        NOT NULL,
    employee_id            NUMBER        NOT NULL,
    department_id          NUMBER,
    salary_before          NUMBER(8,2)   NOT NULL,
    salary_after           NUMBER(8,2)   NOT NULL,
    pct_gap_to_avg_before  NUMBER(8,4),              -- Brecha antes del ajuste
    rule_applied           VARCHAR2(100) NOT NULL,   -- Regla que aplicó (ALTO/MEDIO/BAJO)
    executed_by            VARCHAR2(100) DEFAULT USER NOT NULL,
    executed_at            DATE          DEFAULT SYSDATE NOT NULL,
    notes                  VARCHAR2(400)
);
ALTER TABLE audit_salary_adjustments_t1
    ADD CONSTRAINT pk_audit_salary_adjustments_t1 PRIMARY KEY (audit_id);

-- Secuencia para generar audit_id automáticamente
CREATE SEQUENCE audit_salary_adj_t1_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- Tabla de variantes: define los parámetros según la variante asignada
CREATE TABLE t1_variants (
    variant_id                    NUMBER       NOT NULL,
    variant_name                  VARCHAR2(80) NOT NULL,
    excluded_department_id        NUMBER,
    min_years_service             NUMBER       NOT NULL,
    recent_job_history_months     NUMBER       NOT NULL,
    gap_high_threshold_pct        NUMBER(6,2)  NOT NULL,
    gap_mid_threshold_pct         NUMBER(6,2)  NOT NULL,
    raise_high_pct                NUMBER(6,2)  NOT NULL,
    raise_mid_pct                 NUMBER(6,2)  NOT NULL,
    raise_low_pct                 NUMBER(6,2)  NOT NULL,
    max_salary_vs_avg_pct         NUMBER(6,2)  NOT NULL,
    notes                         VARCHAR2(300),
    CONSTRAINT pk_t1_variants PRIMARY KEY (variant_id)
);

-- Insertamos las 4 variantes del taller
INSERT INTO t1_variants VALUES (1,'Variante A - Operación estándar',90,3,24,10,5,8,5,3,120,'Excluir depto 90.');
INSERT INTO t1_variants VALUES (2,'Variante B - Mayor restricción por historial',60,3,18,10,5,8,5,3,120,'Excluir depto 60. Revisar historial últimos 18 meses.');
INSERT INTO t1_variants VALUES (3,'Variante C - Ajuste conservador',100,4,24,12,6,7,4,2,118,'Excluir depto 100. Exigir 4 años de antigüedad.');
INSERT INTO t1_variants VALUES (4,'Variante D - Ajuste agresivo controlado',30,3,24,9,4,9,6,3,119,'Excluir depto 30.');
COMMIT;

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX ix_t1_emp_dept ON t1_employees(department_id);
CREATE INDEX ix_t1_emp_mgr  ON t1_employees(manager_id);
CREATE INDEX ix_t1_jh_emp   ON t1_job_history(employee_id);
```

---

### 1.2 Carga de Datos y Casos Borde

Script que agrega empleados y departamentos especiales para probar casos límite: departamentos pequeños, empleados sin departamento, historial reciente, y salarios cercanos al tope.

```sql
-- =====================================================================
-- 02_datos_taller1.sql
-- AUTOR: Paula Buitrago / Sergio Mahecha
-- FECHA: 08/04/2026
-- DESCRIPCIÓN: Inserta departamentos y empleados de prueba para generar
--              casos borde: dpto con < 3 empleados, sin departamento,
--              historial reciente, y salarios ajustados para testear topes.
-- =====================================================================

SET SERVEROUTPUT ON
WHENEVER SQLERROR EXIT SQL.SQLCODE

-- Departamentos adicionales para casos borde
INSERT INTO t1_departments (department_id, department_name, manager_id, location_id)
VALUES (280, 'Innovation Lab', 145, 1700);

INSERT INTO t1_departments (department_id, department_name, manager_id, location_id)
VALUES (290, 'Compliance Cell', 149, 1700);

-- Departamento 280: solo 2 empleados → debe ser excluido (regla: mínimo 3)
INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (301,'Nora','Quintana','NQUINTAN','515.123.9001',
    ADD_MONTHS(TRUNC(SYSDATE),-70),'SA_REP',5200,.15,149,280);

INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (302,'Pablo','Mena','PMENA','515.123.9002',
    ADD_MONTHS(TRUNC(SYSDATE),-62),'SA_REP',5400,.10,149,280);

-- Departamento 290: mezcla de elegibles y no elegibles
INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (303,'Sara','Luna','SLUNA','515.123.9003',
    ADD_MONTHS(TRUNC(SYSDATE),-85),'ST_CLERK',3100,NULL,124,290);

INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (304,'Tomas','Rueda','TRUEDA','515.123.9004',
    ADD_MONTHS(TRUNC(SYSDATE),-55),'ST_CLERK',3300,NULL,124,290);

INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (305,'Valeria','Nieto','VNIETO','515.123.9005',
    ADD_MONTHS(TRUNC(SYSDATE),-92),'ST_CLERK',3500,NULL,124,290);

INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (306,'Yuri','Mora','YMORA','515.123.9006',
    ADD_MONTHS(TRUNC(SYSDATE),-15),'ST_CLERK',2900,NULL,124,290);

-- Ajustes de salarios para construir brechas y forzar validación de topes
UPDATE t1_employees SET salary = 7200  WHERE employee_id = 176;
UPDATE t1_employees SET salary = 6800  WHERE employee_id = 177;
UPDATE t1_employees SET salary = 6100  WHERE employee_id = 179;
UPDATE t1_employees SET salary = 5900  WHERE employee_id = 180;
UPDATE t1_employees SET salary = 5600  WHERE employee_id = 181;
UPDATE t1_employees SET salary = 15800 WHERE employee_id = 108;
UPDATE t1_employees SET salary = 16100 WHERE employee_id = 109;
UPDATE t1_employees SET salary = 11800 WHERE employee_id = 110;
UPDATE t1_employees SET salary = 11750 WHERE employee_id = 111;
UPDATE t1_employees SET salary = 6200  WHERE employee_id = 112;
UPDATE t1_employees SET salary = 6500  WHERE employee_id = 113;
UPDATE t1_employees SET salary = 6000  WHERE employee_id = 149; -- Manager bajo para no confundir
UPDATE t1_employees SET salary = 7700  WHERE employee_id = 174; -- Cercano al tope

-- Historial reciente: estos empleados quedarán excluidos aunque parezcan elegibles
INSERT INTO t1_job_history (employee_id, start_date, end_date, job_id, department_id)
VALUES (176, ADD_MONTHS(TRUNC(SYSDATE),-14), ADD_MONTHS(TRUNC(SYSDATE),-8), 'SA_REP', 80);

INSERT INTO t1_job_history (employee_id, start_date, end_date, job_id, department_id)
VALUES (304, ADD_MONTHS(TRUNC(SYSDATE),-10), ADD_MONTHS(TRUNC(SYSDATE),-6), 'ST_CLERK', 290);

-- Empleado sin departamento: debe descartarse automáticamente
INSERT INTO t1_employees (employee_id, first_name, last_name, email, phone_number,
    hire_date, job_id, salary, commission_pct, manager_id, department_id)
VALUES (307,'Carla','SinDepto','CSINDEP','515.123.9007',
    ADD_MONTHS(TRUNC(SYSDATE),-100),'SA_REP',4100,NULL,149,NULL);

COMMIT;
```

---

### 1.3 Plantilla de Entrega — Estructura del Taller

Plantilla oficial del taller con las secciones que deben desarrollarse: consulta diagnóstica, elegibles, prevalidación, transacción ACID y validación posterior.

```sql
-- =====================================================================
-- 03_template_entrega_taller1_v2.sql
-- AUTOR: Paula Valeria Buitrago Velandia / Sergio Andrés Mahecha Rodríguez
-- CURSO: Bases de Datos 2
-- FECHA: 08/04/2026 · VARIANTE: 2
-- DESCRIPCIÓN: Plantilla de entrega del taller. Aplica ajustes salariales
--              con transacciones ACID, CTEs, funciones analíticas y auditoría.
-- =====================================================================

SET SERVEROUTPUT ON
SET FEEDBACK ON

DEFINE p_variant_id    = 2
DEFINE p_execution_tag = 'P01_FINAL'

-- ============================================================
-- SECCIÓN 0: Verificación de la variante asignada
-- Consultamos los parámetros que usaremos en todo el taller
-- ============================================================
SELECT variant_id, variant_name, excluded_department_id,
       min_years_service, recent_job_history_months,
       gap_high_threshold_pct, gap_mid_threshold_pct,
       raise_high_pct, raise_mid_pct, raise_low_pct,
       max_salary_vs_avg_pct, notes
FROM t1_variants
WHERE variant_id = &p_variant_id;

-- ============================================================
-- SECCIÓN 1: Consulta Diagnóstica
-- Objetivo: Analizar el estado actual ANTES de hacer ajustes.
-- Muestra estadísticas por departamento y posición de cada empleado.
-- ============================================================
-- [ESCRIBIR AQUÍ la consulta con CTE + función analítica]
-- Columnas mínimas requeridas:
-- employee_id, first_name, last_name, job_id, manager_id,
-- department_id, department_name, salary, hire_date,
-- years_service, dept_avg_salary, dept_max_salary,
-- dept_employee_count, pct_gap_to_avg, recent_job_history_flag,
-- salary_rank_in_department

-- ============================================================
-- SECCIÓN 2: Decisión de Población Elegible
-- Objetivo: Determinar quién SÍ y quién NO aplica para ajuste.
-- Criterios de exclusión según Variante 2:
--   - Departamento 60 excluido
--   - Menos de 3 años de antigüedad
--   - Historial en últimos 18 meses
--   - Gerentes o directivos
--   - Departamentos con < 3 empleados
--   - Sin departamento asignado
-- ============================================================
-- [ESCRIBIR AQUÍ la consulta de elegibilidad]
-- Columnas mínimas: employee_id, first_name, last_name,
-- department_id, department_name, salary, years_service,
-- dept_avg_salary, pct_gap_to_avg, recent_job_history_flag,
-- manager_or_exec_flag, eligibility_flag, exclusion_reason,
-- adjustment_pct, rule_applied

-- ============================================================
-- SECCIÓN 3: Prevalidación
-- Objetivo: Simular el resultado antes de ejecutar el cambio real.
-- A. Resumen total (antes/después/incremento)
-- B. Detalle por empleado elegible
-- C. Control de topes por departamento
-- ============================================================
-- [ESCRIBIR AQUÍ las 3 consultas de prevalidación]

-- ============================================================
-- SECCIÓN 4: Ejecución Transaccional (ACID)
-- ============================================================

SAVEPOINT sv_before_adjustment;
-- Punto de restauración: si algo falla, regresamos aquí con ROLLBACK TO

-- 4.1 UPDATE de salarios (solo empleados ELEGIBLES)
-- [ESCRIBIR AQUÍ el UPDATE o MERGE]

-- 4.2 INSERT en tabla de auditoría
INSERT INTO audit_salary_adjustments_t1 (
    audit_id, execution_tag, variant_id, employee_id, department_id,
    salary_before, salary_after, pct_gap_to_avg_before,
    rule_applied, executed_by, executed_at, notes
)
-- [ESCRIBIR AQUÍ el SELECT que alimenta la auditoría]
;

-- 4.3 Validación intermedia: verificar que ningún salario supere el tope
-- [ESCRIBIR AQUÍ la consulta que muestra validation_status por empleado]

-- 4.4 Control transaccional
-- Si toda la validación es correcta → COMMIT
-- Si algún empleado supera el tope   → ROLLBACK TO sv_before_adjustment
-- [ESCRIBIR AQUÍ la decisión con comentario justificando el por qué]

-- ============================================================
-- SECCIÓN 5: Validación Posterior
-- Filtra siempre por &p_execution_tag para ver solo ESTA ejecución
-- ============================================================

-- SALIDA 1: Empleados impactados
-- SALIDA 2: Resumen económico final
-- SALIDA 3: Validación de topes
-- SALIDA 4: Auditoría generada
-- [ESCRIBIR AQUÍ las 4 consultas de validación]

-- ============================================================
-- SECCIÓN 6: Justificación Técnica ACID
-- ============================================================
-- ATOMICIDAD: Todo el ajuste ocurre junto o no ocurre. El SAVEPOINT
-- permite deshacer si se detecta algún incumplimiento intermedio.

-- CONSISTENCIA: Los topes de salario se validan antes del COMMIT para
-- garantizar que ningún empleado quede fuera del rango permitido.

-- AISLAMIENTO: Mientras la transacción no hace COMMIT, otras sesiones
-- no ven los salarios nuevos (nivel READ COMMITTED por defecto en Oracle).

-- DURABILIDAD: Una vez ejecutado el COMMIT, los cambios quedan
-- persistidos en el redo log y sobreviven a reinicios del sistema.

-- USO DE SAVEPOINT: Controlamos el riesgo de actualizar empleados que
-- luego resulten fuera de tope, pudiendo revertir sin perder el trabajo
-- diagnóstico hecho en las secciones anteriores.
```

**Conceptos clave del taller:**
- **CTE (`WITH`):** consultas temporales que dividen la lógica en partes legibles.
- **Funciones analíticas (`DENSE_RANK`, `ROW_NUMBER`):** calculan posiciones sin colapsar filas.
- **SAVEPOINT / ROLLBACK TO:** permiten deshacer parcialmente una transacción.
- **ACID:** garantía de que las operaciones son Atómicas, Consistentes, Aisladas y Durables.
