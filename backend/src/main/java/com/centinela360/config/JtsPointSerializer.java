package com.centinela360.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.locationtech.jts.geom.Point;

import java.io.IOException;

/**
 * Serializador personalizado para geometrías Point de JTS.
 * Evita la recursión infinita (StackOverflowError) de los getters internos de JTS (getEnvelope, getFactory, etc.)
 * serializando limpiamente un objeto con latitud y longitud.
 */
public class JtsPointSerializer extends JsonSerializer<Point> {

    @Override
    public void serialize(Point value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }
        gen.writeStartObject();
        gen.writeNumberField("latitude", value.getY());
        gen.writeNumberField("longitude", value.getX());
        gen.writeEndObject();
    }
}
