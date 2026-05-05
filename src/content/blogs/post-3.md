---
title: "PL/SQL Scripts"
author: "Paula Buitrago Velandia"
description: "Colección de scripts y algoritmos desarrollados en PL/SQL."
image:
  url: "../../assets/images/3.jpg"
  alt: "Programación PL/SQL"
pubDate: 2026-02-01
tags: ["BD2", "Oracle", "PL/SQL"]
---

En esta sección se documentan los scripts desarrollados durante el semestre, organizados por complejidad y aplicación.

## 1. Algoritmos de Lógica Básica

### A. Primo o No Primo
Este script determina si el día actual del mes es un número primo.
```sql
DECLARE   
    vd_fecha timestamp := systimestamp;  
    vn_primo number;  
BEGIN   
SELECT COUNT(*) INTO vn_primo  
    FROM dual  
    WHERE (  
        SELECT COUNT(*)  
        FROM (SELECT LEVEL i FROM dual CONNECT BY LEVEL <= TO_CHAR(SYSDATE, 'DD'))  
        WHERE MOD(TO_CHAR(SYSDATE, 'DD'), i) = 0) = 2;  
    IF vn_primo = 1 THEN  
        dbms_output.put_line('Es primo');  
    ELSE  
        dbms_output.put_line('No es primo');  
    END IF;  
END;
/
´´´
### B. Primo o No Primo
Generación de la serie hasta el número 100.
DECLARE  
    vn_num1 number := 0; 
    vn_num2 number :=1; 
    vn_suma number :=0; 
BEGIN  
    dbms_output.put_line(vn_num1); 
    WHILE vn_num2 <= 100 LOOP 
    dbms_output.put_line(vn_num2); 
    vn_suma:= vn_num1 + vn_num2; 
    vn_num1:= vn_num2; 
    vn_num2:= vn_suma; 
    END LOOP; 
END;

2. Funciones Personalizadas
Saludo con Parámetros
SQL
CREATE OR REPLACE FUNCTION fn_saludo_varchar (param_nombres VARCHAR2) 
RETURN VARCHAR2 IS 
    vv_nombre VARCHAR2(50); 
BEGIN 
    vv_nombre := 'hola ' || param_nombres; 
    RETURN vv_nombre; 
END;  
Cálculo de Integral (Método Riemann)
SQL
CREATE OR REPLACE FUNCTION fn_integral_x2 (param_Linferior NUMBER, param_Lsuperior NUMBER, param_subdivisiones NUMBER) 
RETURN NUMBER IS  
vv_dx NUMBER; 
vv_suma NUMBER := 0; 
vv_x NUMBER; 
BEGIN 
vv_dx := (param_Lsuperior - param_Linferior) / param_subdivisiones; 
FOR i IN 1..param_subdivisiones LOOP 
vv_x := param_Linferior + i * vv_dx;  
vv_suma := vv_suma + (POWER(vv_x,2) * vv_dx); 
END LOOP; 
RETURN(vv_suma); 
END;