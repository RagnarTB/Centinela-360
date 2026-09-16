package com.centinela360.config;

import io.r2dbc.postgresql.codec.Json;
import io.r2dbc.postgresql.codec.Box;
import io.r2dbc.spi.Parameter;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.WKBReader;
import org.locationtech.jts.io.WKBWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect; // <- Importación corregida

import java.nio.ByteBuffer;
import java.util.List;

@Configuration
public class R2dbcConfig {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @ReadingConverter
    static class ByteBufferToPointConverter implements Converter<ByteBuffer, Point> {
        @Override
        public Point convert(ByteBuffer source) {
            try {
                byte[] bytes = new byte[source.remaining()];
                source.get(bytes);
                Geometry geometry = new WKBReader(GEOMETRY_FACTORY).read(bytes);
                return (Point) geometry;
            } catch (ParseException e) {
                throw new IllegalArgumentException("No se pudo leer geometry como Point", e);
            }
        }
    }

    @WritingConverter
    static class PointToByteBufferConverter implements Converter<Point, ByteBuffer> {
        @Override
        public ByteBuffer convert(Point source) {
            byte[] bytes = new WKBWriter(2, true).write(source);
            return ByteBuffer.wrap(bytes);
        }
    }

    @Bean
    public R2dbcCustomConversions r2dbcCustomConversions() {
        return R2dbcCustomConversions.of(
                PostgresDialect.INSTANCE,
                List.of(new ByteBufferToPointConverter(), new PointToByteBufferConverter()));
    }

    public static Point makePoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(4326);
        return point;
    }
}
