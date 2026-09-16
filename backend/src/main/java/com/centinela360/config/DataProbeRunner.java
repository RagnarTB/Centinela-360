package com.centinela360.config;

import com.centinela360.domain.Report;
import com.centinela360.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataProbeRunner implements CommandLineRunner {

    private final ReportRepository reportRepository;

    @Override
    public void run(String... args) {
        Report report = Report.builder()
                .channel("APP")
                .category("PRUEBA_CONVERTER")
                .description("Verificando converter de geometria")
                .status("RECIBIDO")
                .location(R2dbcConfig.makePoint(-79.8374, -6.7714))
                .build();

        reportRepository.save(report)
                .doOnNext(r -> System.out.println(">>> GUARDADO OK: " + r))
                .flatMap(r -> reportRepository.findById(r.getId()))
                .doOnNext(r -> System.out.println(">>> LEIDO OK: " + r))
                .subscribe(
                        r -> {
                        },
                        error -> System.out.println(">>> ERROR EN CONVERTER: " + error)
                );
    }
}