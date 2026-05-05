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

### Primo o No Primo
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