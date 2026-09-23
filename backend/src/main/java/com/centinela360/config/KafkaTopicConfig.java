package com.centinela360.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic reportsCreatedTopic() {
        return TopicBuilder.name("reports.created")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic reportsValidatedTopic() {
        return TopicBuilder.name("reports.validated").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic incidentsUpdatedTopic() {
        return TopicBuilder.name("incidents.updated").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic unitsLocationUpdatedTopic() {
        return TopicBuilder.name("units.location.updated").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic dispatchCreatedTopic() {
        return TopicBuilder.name("dispatch.created").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic dispatchStatusUpdatedTopic() {
        return TopicBuilder.name("dispatch.status.updated").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic alertsCreatedTopic() {
        return TopicBuilder.name("alerts.created").partitions(1).replicas(1).build();
    }
}